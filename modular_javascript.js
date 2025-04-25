// produtos.js - Lista de produtos agora em um arquivo separado
const produtosDados = `
REFRIKO,REFRIKO FRAMBOESA 6X2LT
REFRIKO,TUBA JUJUBA GUARANA 6X2LT
REFRISHOW,REFRISHOW LARANJA 6X2LT
`;

const produtosPorFamilia = {};
produtosDados.trim().split('\n').forEach(line => {
  const [famRaw, prodRaw] = line.split(',');
  if (!famRaw || !prodRaw) return;
  const fam = famRaw.trim(), prod = prodRaw.trim();
  produtosPorFamilia[fam] = produtosPorFamilia[fam] || [];
  produtosPorFamilia[fam].push(prod);
});

const familias = Object.keys(produtosPorFamilia);

// -------------------------------------------------------
// templates.js - Gerenciador de templates
const Templates = {
  // Gera ID único para cada novo item
  generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  // Cria um item sell-out ou sell-in a partir do template
  createItem(type, isSellIn = false) {
    const template = document.getElementById('item-template');
    const clone = document.importNode(template.content, true);
    const itemId = this.generateId();
    const container = document.getElementById(`items-container-${type}`);
    const itemCount = container.querySelectorAll('.item-row').length + 1;
    
    // Configura o clone com identificadores únicos
    const itemRow = clone.querySelector('.item-row');
    itemRow.dataset.id = itemId;
    itemRow.querySelector('h4').textContent = `Item #${itemCount}`;
    
    // Configura os nomes dos campos para sell-in se necessário
    if (isSellIn) {
      const inputs = clone.querySelectorAll('input, select');
      inputs.forEach(input => {
        if (input.name.includes('[]')) {
          input.name = input.name.replace('[]', '_in[]');
        }
      });
    }
    
    return { clone, itemId };
  },
  
// templates.js (continuação)
  // Cria um item de merchandising a partir do template
  createMerchItem() {
    const template = document.getElementById('merch-item-template');
    const clone = document.importNode(template.content, true);
    const itemId = this.generateId();
    const container = document.getElementById('merch-items-container');
    const itemCount = container.querySelectorAll('.merch-item-row').length + 1;
    
    // Configura o clone com identificadores únicos
    const itemRow = clone.querySelector('.merch-item-row');
    itemRow.dataset.id = itemId;
    itemRow.querySelector('h4').textContent = `Item #${itemCount}`;
    
    return { clone, itemId };
  },
  
  // Renumera os itens para manter a sequência após remoção
  renumberItems(containerId) {
    const items = document.querySelectorAll(`#${containerId} .item-row, #${containerId} .merch-item-row`);
    items.forEach((item, index) => {
      item.querySelector('h4').textContent = `Item #${index + 1}`;
    });
  }
};

// -------------------------------------------------------
// validation.js - Validação de formulários
const Validation = {
  // Verifica campos obrigatórios
  validateField(field) {
    if (field.hasAttribute('required') && !field.value.trim()) {
      field.classList.add('error');
      const errorMsg = field.closest('.form-group').querySelector('.error-message');
      if (errorMsg) {
        errorMsg.textContent = 'Este campo é obrigatório';
      }
      return false;
    } else {
      field.classList.remove('error');
      const errorMsg = field.closest('.form-group').querySelector('.error-message');
      if (errorMsg) {
        errorMsg.textContent = '';
      }
      return true;
    }
  },
  
  // Valida o formulário completo
  validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    // Limpa mensagens de erro anteriores
    form.querySelectorAll('.error-message').forEach(msg => {
      msg.textContent = '';
    });
    form.querySelectorAll('.error').forEach(field => {
      field.classList.remove('error');
    });
    
    // Valida cada campo obrigatório
    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    // Exibe toast com mensagem de erro se necessário
    if (!isValid) {
      UI.showToast('Verifique os campos obrigatórios em destaque.', 'error');
    }
    
    return isValid;
  }
};

// -------------------------------------------------------
// pdfGenerator.js - Geração de PDF
const PDFGenerator = {
  async generateDossie(formData) {
    try {
      UI.showLoading();
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 20;
      
      // Pré-carrega fotos merch → DataURLs
      const merchInputs = Array.from(document.querySelectorAll('input[name="merch_item_photo[]"]'));
      const merchFiles = merchInputs.flatMap(i => Array.from(i.files));
      const merchPhotosData = await Promise.all(
        merchFiles.map(file => this.readFileAsDataURL(file))
      );
      
      // Cabeçalho
      doc.setFontSize(18); 
      doc.text('Dossiê de Verba', 14, y); 
      y += 10;
      
      doc.setFontSize(12);
      doc.text(`Rede: ${formData.rede}`, 14, y); y += 6;
      doc.text(`Mercado: ${formData.mercado}`, 14, y); y += 6;
      doc.text(`Cidade/UF: ${formData.cidade} - ${formData.uf}`, 14, y); y += 6;
      doc.text(`Vendedor: ${formData.vendedor}`, 14, y); y += 6;
      if (formData.contrato) {
        doc.text(`Contrato: ${formData.contrato}`, 14, y); y += 6;
      }
      y += 4;
      
      // Data do documento
      const hoje = new Date();
      doc.text(`Data: ${hoje.toLocaleDateString('pt-BR')}`, 14, y); y += 10;
      
      // SELL OUT
      const sellOutRows = this.collectRows('items-container-sell-out');
      if (sellOutRows.length) {
        doc.setFontSize(14); 
        doc.text('SELL OUT', 14, y); 
        y += 8;
        
        doc.autoTable({ 
          startY: y,
          head: [['FAMÍLIA', 'PRODUTO', 'UNIDADES', 'BONIFICAÇÃO (R$)', 'VERBA (R$)', 'TTC (R$)', 'TTV (R$)']],
          body: sellOutRows, 
          theme: 'grid',
          headStyles: { fillColor: [0, 123, 255], textColor: 255, fontStyle: 'bold' }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // SELL IN
      const sellInRows = this.collectRows('items-container-sell-in', true);
      if (sellInRows.length) {
        doc.setFontSize(14); 
        doc.text('SELL IN', 14, y); 
        y += 8;
        
        doc.autoTable({ 
          startY: y,
          head: [['FAMÍLIA', 'PRODUTO', 'UNIDADES', 'BONIFICAÇÃO (R$)', 'VERBA (R$)', 'TTC (R$)', 'TTV (R$)']],
          body: sellInRows, 
          theme: 'grid',
          headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // MERCHANDISING com padding e coluna larga
      const merchRows = this.collectMerchRows();
      if (merchRows.length) {
        doc.setFontSize(14); 
        doc.text('MERCHANDISING', 14, y); 
        y += 8;
        
        doc.autoTable({
          startY: y,
          head: [['VERBA (R$)', 'OPÇÃO', 'FOTO']],
          body: merchRows.map((r, i) => [r[0], r[1], '']),
          theme: 'grid',
          styles: { cellPadding: 6 },
          columnStyles: { 2: { cellWidth: 24 } },
          headStyles: { fillColor: [255, 193, 7], textColor: 0, fontStyle: 'bold' },
          didDrawCell: data => {
            if (data.section === 'body' && data.column.index === 2) {
              const imgObj = merchPhotosData[data.row.index];
              if (!imgObj) return;
              const mode = imgObj.type.includes('png') ? 'PNG' : 'JPEG';
              doc.addImage(imgObj.dataUrl, mode, data.cell.x + 4, data.cell.y + 4, 16, 16);
            }
          }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // Totais
      let totalSellOut = 0, totalSellIn = 0, totalMerch = 0;
      sellOutRows.forEach(r => totalSellOut += parseFloat(r[4]) || 0);
      sellInRows.forEach(r => totalSellIn += parseFloat(r[4]) || 0);
      merchRows.forEach(r => totalMerch += parseFloat(r[0]) || 0);
      const totalGeral = totalSellOut + totalSellIn + totalMerch;
      
      doc.setFontSize(12);
      doc.text(`TOTAL SELL OUT: R$ ${totalSellOut.toFixed(2)}`, 14, y); y += 6;
      doc.text(`TOTAL SELL IN: R$ ${totalSellIn.toFixed(2)}`, 14, y); y += 6;
      doc.text(`TOTAL MERCHANDISING: R$ ${totalMerch.toFixed(2)}`, 14, y); y += 6;
      doc.setFontSize(14);
      doc.text(`TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`, 14, y); y += 10;
      
      // Assinaturas
      doc.setFontSize(12);
      doc.text('Assinaturas:', 14, y); y += 10;
      doc.text('______________________________', 14, y); y += 6;
      doc.text('RAFAEL SPERB', 14, y); y += 15;
      doc.text('______________________________', 14, y); y += 6;
      doc.text('WELLINGTON MARTINS', 14, y); y += 15;
      
      if (totalGeral >= 15000) {
        doc.text('______________________________', 14, y); y += 6;
        doc.text('MARCIO MENDES', 14, y); y += 15;
      }
      
      // Mescla jsPDF + anexos gerais
      const jsPdfBytes = doc.output('arraybuffer');
      const pdfDoc = await PDFLib.PDFDocument.load(jsPdfBytes);
      
      // Adiciona anexos
      await this.addAttachments(pdfDoc, formData.dossie_files);
      
      // Páginas com fotos de merchandising ampliadas
      await this.addMerchandisingPhotos(pdfDoc, merchPhotosData);
      
      const finalBytes = await pdfDoc.save();
      download(finalBytes, `dossie_${formData.rede || 'sem-rede'}_${hoje.toISOString().split('T')[0]}.pdf`, 'application/pdf');
      
      UI.hideLoading();
      UI.showToast('Dossiê gerado com sucesso!', 'success');
      document.getElementById('btn-docusign').style.display = 'block';
      
      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      UI.hideLoading();
      UI.showToast('Erro ao gerar o dossiê. Tente novamente.', 'error');
      return false;
    }
  },
  
  // Lê arquivo e converte para DataURL
  readFileAsDataURL(file) {
    return new Promise(resolve => {
      if (!file) resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, type: file.type });
      reader.readAsDataURL(file);
    });
  },
  
  // Coleta dados das linhas de items
  collectRows(containerId, isSellIn = false) {
    const prefix = isSellIn ? '_in' : '';
    return Array.from(document.getElementById(containerId).querySelectorAll('.item-row'))
      .map(r => [
        r.querySelector(`[name^="item_familia${prefix}"]`).value || '',
        r.querySelector(`[name^="item_produto${prefix}"]`).value || '',
        r.querySelector(`[name^="item_unidades${prefix}"]`).value || '',
        r.querySelector(`[name^="item_bonificacao${prefix}"]`).value || '',
        r.querySelector(`[name^="item_verba${prefix}"]`).value || '',
        r.querySelector(`[name^="item_ttc${prefix}"]`).value || '',
        r.querySelector(`[name^="item_ttv${prefix}"]`).value || ''
      ])
      .filter(r => r.some(c => c !== ''));
  },
  
  // Coleta dados de merchandising
  collectMerchRows() {
    return Array.from(document.querySelectorAll('.merch-item-row'))
      .map(r => {
        const opcao = r.querySelector('[name="merch_item_opcao[]"]').value;
        const custom = r.querySelector('[name="merch_item_custom[]"]')?.value;
        
        return [
          r.querySelector('[name="merch_item_verba[]"]').value || '',
          opcao === 'OUTRO' && custom ? custom : opcao
        ];
      })
      .filter(r => r.some(c => c !== ''));
  },
  
  // Adiciona anexos ao PDF
  async addAttachments(pdfDoc, fileList) {
    for (const file of fileList) {
      const buf = await file.arrayBuffer();
      if (file.type === 'application/pdf') {
        const src = await PDFLib.PDFDocument.load(buf);
        const pages = await pdfDoc.copyPages(src, src.getPageIndices());
        pages.forEach(p => pdfDoc.addPage(p));
      } else if (file.type.includes('image')) {
        const img = file.type.includes('png')
          ? await pdfDoc.embedPng(buf)
          : await pdfDoc.embedJpg(buf);
        const { width, height } = img.scaleToFit(595, 841);
        const pg = pdfDoc.addPage([595, 841]);
        pg.drawImage(img, { x: 0, y: 841 - height, width, height });
      }
    }
  },
  
  // Adiciona fotos de merchandising ampliadas
  async addMerchandisingPhotos(pdfDoc, merchPhotosData) {
    const helvB = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    
    for (let i = 0; i < merchPhotosData.length; i++) {
      if (!merchPhotosData[i]) continue;
      
      const { dataUrl, type } = merchPhotosData[i];
      if (!dataUrl) continue;
      
      const img = type.includes('png')
        ? await pdfDoc.embedPng(dataUrl)
        : await pdfDoc.embedJpg(dataUrl);
        
      const { width, height } = img.scaleToFit(400, 400);
      const pg = pdfDoc.addPage([595, 841]);
      
      pg.drawText(`Foto de Merchandising ${i + 1}`, {
        x: 20,
        y: 841 - 40,
        size: 14,
        font: helvB
      });
      
      pg.drawImage(img, {
        x: (595 - width) / 2,  // Centralizar horizontalmente
        y: 841 - height - 80,  // Posicionar abaixo do título
        width,
        height
      });
    }
  }
};

// -------------------------------------------------------
// ui.js - Interface de usuário
const UI = {
  showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
  },
  
  hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
  },
  
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },
  
  updateSummary() {
    // Sell Out summary
    const sellOutItems = document.querySelectorAll('#items-container-sell-out .item-row');
    let sellOutTotal = 0;
    sellOutItems.forEach(item => {
      const verba = parseFloat(item.querySelector('.item-verba').value) || 0;
      sellOutTotal += verba;
    });
    document.getElementById('sell-out-count').textContent = sellOutItems.length;
    document.getElementById('sell-out-total').textContent = sellOutTotal.toFixed(2);
    
    // Sell In summary
    const sellInItems = document.querySelectorAll('#items-container-sell-in .item-row');
    let sellInTotal = 0;
    sellInItems.forEach(item => {
      const verba = parseFloat(item.querySelector('.item-verba').value) || 0;
      sellInTotal += verba;
    });
    document.getElementById('sell-in-count').textContent = sellInItems.length;
    document.getElementById('sell-in-total').textContent = sellInTotal.toFixed(2);
    
    // Merchandising summary
    const merchItems = document.querySelectorAll('#merch-items-container .merch-item-row');
    let merchTotal = 0;
    merchItems.forEach(item => {
      const verba = parseFloat(item.querySelector('.merch-item-verba').value) || 0;
      merchTotal += verba;
    });
    document.getElementById('merch-count').textContent = merchItems.length;
    document.getElementById('merch-total').textContent = merchTotal.toFixed(2);
  },
  
  // Exibe prévia das imagens selecionadas
  showFilePreview(input, previewContainer) {
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            previewContainer.appendChild(img);
          };
          reader.readAsDataURL(file);
        } else {
          const div = document.createElement('div');
          div.textContent = file.name;
          div.className = 'file-preview-text';
          previewContainer.appendChild(div);
        }
      });
    }
  },
  
  // Exibe confirmação antes de remover um item
  confirmRemove(callback) {
    if (confirm('Tem certeza que deseja remover este item?')) {
      callback();
      this.updateSummary();
    }
  }
};