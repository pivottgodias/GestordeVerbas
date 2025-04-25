// pdfGenerator.js - Geração de PDF Aprimorado Visualmente
const PDFGenerator = {
  // Configuração de cores e estilos
  styles: {
    colors: {
      primary: [41, 128, 185],      // Azul principal
      secondary: [46, 204, 113],    // Verde
      accent: [241, 196, 15],       // Amarelo
      dark: [52, 73, 94],           // Cinza escuro
      light: [236, 240, 241]        // Cinza claro
    },
    fonts: {
      header: 'helvetica',
      body: 'helvetica'
    }
  },
  
  async generateDossie(formData) {
    try {
      UI.showLoading();
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true
      });
      
      // Configuração de margens mais confortáveis
      const margin = 20;      // Margem padrão em mm
      const pageWidth = 210;  // Largura A4 em mm
      const pageHeight = 297; // Altura A4 em mm
      const contentWidth = pageWidth - (margin * 2);
      
      // Variável para controle de posição vertical
      let y = margin;
      
      // Pré-carrega fotos merch → DataURLs
      const merchInputs = Array.from(document.querySelectorAll('input[name="merch_item_photo[]"]'));
      const merchFiles = merchInputs.flatMap(i => Array.from(i.files));
      const merchPhotosData = await Promise.all(
        merchFiles.map(file => this.readFileAsDataURL(file))
      );
      
      // Adicionar cabeçalho com destaque visual
      this.addHeader(doc, 'Dossiê de Verba', y);
      y += 16;
      
      // Adicionar caixa de informações
      y = this.addInfoBox(doc, {
        rede: formData.rede,
        mercado: formData.mercado,
        cidade_uf: `${formData.cidade} - ${formData.uf}`,
        vendedor: formData.vendedor,
        contrato: formData.contrato,
        data: new Date().toLocaleDateString('pt-BR')
      }, y);
      
      y += 10;
      
      // SELL OUT com estilo aprimorado
      const sellOutRows = this.collectRows('items-container-sell-out');
      if (sellOutRows.length) {
        this.addSectionTitle(doc, 'SELL OUT', y, this.styles.colors.primary);
        y += 8;
        
        doc.autoTable({ 
          startY: y,
          head: [['FAMÍLIA', 'PRODUTO', 'UNIDADES', 'BONIFICAÇÃO (R$)', 'VERBA (R$)', 'TTC (R$)', 'TTV (R$)']],
          body: sellOutRows,
          theme: 'grid',
          headStyles: { 
            fillColor: this.styles.colors.primary, 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 4
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: 4
          },
          margin: { left: margin, right: margin },
          styles: { 
            overflow: 'linebreak',
            cellWidth: 'wrap',
            halign: 'center',
            valign: 'middle'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { fontStyle: 'bold' }
          },
          didParseCell: (data) => {
            // Aumentar largura das colunas específicas
            if (data.column.index === 1) { // Coluna de produto
              data.cell.styles.cellWidth = 40;
            }
          }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // SELL IN com estilo aprimorado
      const sellInRows = this.collectRows('items-container-sell-in', true);
      if (sellInRows.length) {
        this.addSectionTitle(doc, 'SELL IN', y, this.styles.colors.secondary);
        y += 8;
        
        doc.autoTable({ 
          startY: y,
          head: [['FAMÍLIA', 'PRODUTO', 'UNIDADES', 'BONIFICAÇÃO (R$)', 'VERBA (R$)', 'TTC (R$)', 'TTV (R$)']],
          body: sellInRows, 
          theme: 'grid',
          headStyles: { 
            fillColor: this.styles.colors.secondary, 
            textColor: 255, 
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 4
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: 4
          },
          margin: { left: margin, right: margin },
          styles: { 
            overflow: 'linebreak',
            cellWidth: 'wrap',
            halign: 'center',
            valign: 'middle'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
    0: { cellWidth: 25 }, // Família
    1: { cellWidth: 45 }, // Produto
    2: { cellWidth: 18 }, // Unidades
    3: { cellWidth: 25 }, // Bonificação
    4: { cellWidth: 22 }, // Verba
    5: { cellWidth: 20 }, // TTC
    6: { cellWidth: 20 }  // TTV
  }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // Verifica se precisa de nova página para o merchandising
      if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
      }
      
      // MERCHANDISING com layout aprimorado
      const merchRows = this.collectMerchRows();
      if (merchRows.length) {
        this.addSectionTitle(doc, 'MERCHANDISING', y, this.styles.colors.accent);
        y += 8;
        
        doc.autoTable({
          startY: y,
          head: [['VERBA (R$)', 'OPÇÃO', 'FOTO']],
          body: merchRows.map((r, i) => [r[0], r[1], '']),
          theme: 'grid',
          styles: { 
            cellPadding: 6,
            fontSize: 9
          },
          columnStyles: { 
            2: { cellWidth: 30 },
            1: { cellWidth: 70 }
          },
          headStyles: { 
            fillColor: this.styles.colors.accent, 
            textColor: 0, 
            fontStyle: 'bold',
            fontSize: 10
          },
          margin: { left: margin, right: margin },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          didDrawCell: data => {
            if (data.section === 'body' && data.column.index === 2) {
              const imgObj = merchPhotosData[data.row.index];
              if (!imgObj) return;
              const mode = imgObj.type.includes('png') ? 'PNG' : 'JPEG';
              
              // Centralizar e dimensionar melhor a miniatura
              const cellWidth = data.cell.width;
              const cellHeight = data.cell.height;
              const imgSize = Math.min(cellWidth - 8, cellHeight - 8);
              
              doc.addImage(
                imgObj.dataUrl, 
                mode, 
                data.cell.x + (cellWidth - imgSize) / 2, 
                data.cell.y + (cellHeight - imgSize) / 2, 
                imgSize, 
                imgSize
              );
            }
          }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // Verificar se precisa de nova página para os totais
      if (y > pageHeight - 80) {
        doc.addPage();
        y = margin;
      }
      
      // Totais com visual melhorado
      let totalSellOut = 0, totalSellIn = 0, totalMerch = 0;
      sellOutRows.forEach(r => totalSellOut += parseFloat(r[4]) || 0);
      sellInRows.forEach(r => totalSellIn += parseFloat(r[4]) || 0);
      merchRows.forEach(r => totalMerch += parseFloat(r[0]) || 0);
      const totalGeral = totalSellOut + totalSellIn + totalMerch;
      
      // Adicionar resumo financeiro em formato de caixa destacada
      y = this.addTotalsBox(doc, {
        sellOut: totalSellOut,
        sellIn: totalSellIn,
        merch: totalMerch,
        total: totalGeral
      }, y);
      
      y += 15;
      
      // Assinaturas com layout melhorado
      this.addSignatureSection(doc, y, totalGeral >= 15000);
      
      // Mescla jsPDF + anexos gerais
      const jsPdfBytes = doc.output('arraybuffer');
      const pdfDoc = await PDFLib.PDFDocument.load(jsPdfBytes);
      
      // Adiciona anexos com página de separação
      await this.addAttachmentsWithSeparator(pdfDoc, formData.dossie_files);
      
      // Páginas com fotos de merchandising ampliadas com melhor layout
      await this.addEnhancedMerchandisingPhotos(pdfDoc, merchPhotosData);
      
      const finalBytes = await pdfDoc.save();
      download(finalBytes, `dossie_${formData.rede || 'sem-rede'}_${new Date().toISOString().split('T')[0]}.pdf`, 'application/pdf');
      
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
  
  // Adiciona cabeçalho elegante
  addHeader(doc, title, y) {
    const pageWidth = doc.internal.pageSize.width;
    
    // Desenhar retângulo de cabeçalho
    doc.setFillColor(...this.styles.colors.dark);
    doc.rect(0, 0, pageWidth, y + 15, 'F');
    
    // Adicionar título
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(24);
    doc.text(title, pageWidth / 2, y + 10, { align: 'center' });
    
    // Restaurar cor de texto
    doc.setTextColor(0);
    doc.setFont(this.styles.fonts.body, 'normal');
  },
  
  // Adiciona título de seção com barra colorida
  addSectionTitle(doc, title, y, color) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    // Desenhar barra colorida
    doc.setFillColor(...color);
    doc.roundedRect(margin, y - 2, pageWidth - (margin * 2), 10, 2, 2, 'F');
    
    // Texto do título
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.text(title, pageWidth / 2, y + 4, { align: 'center' });
    
    // Restaurar cor de texto
    doc.setTextColor(0);
    doc.setFont(this.styles.fonts.body, 'normal');
  },
  
  // Adiciona caixa de informações
  addInfoBox(doc, info, y) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const boxWidth = pageWidth - (margin * 2);
    
    // Altura dinâmica baseada no conteúdo
    const lineHeight = 7;
    const padding = 6;
    let boxHeight = Object.keys(info).length * lineHeight + (padding * 2);
    if (info.contrato) boxHeight += lineHeight;
    
    // Desenhar caixa de fundo
    doc.setFillColor(248, 250, 252); // Cor de fundo suave
    doc.setDrawColor(...this.styles.colors.primary);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'FD');
    
    // Estilos para o texto
    doc.setFontSize(10);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.setTextColor(0);
    
    // Adicionar informações
    let textY = y + padding + 4;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Rede:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.rede, margin + 40, textY);
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Mercado:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.mercado, margin + 40, textY);
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Cidade/UF:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.cidade_uf, margin + 40, textY);
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Vendedor:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.vendedor, margin + 40, textY);
    textY += lineHeight;
    
    if (info.contrato) {
      doc.setFont(this.styles.fonts.body, 'bold');
      doc.text('Contrato:', margin + padding, textY);
      doc.setFont(this.styles.fonts.body, 'normal');
      doc.text(info.contrato, margin + 40, textY);
      textY += lineHeight;
    }
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('Data:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(info.data, margin + 40, textY);
    
    return y + boxHeight;
  },
  
  // Adiciona caixa de totais estilizada
  addTotalsBox(doc, totals, y) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const boxWidth = pageWidth - (margin * 2);
    
    // Altura dinâmica
    const lineHeight = 7;
    const padding = 8;
    const boxHeight = 5 * lineHeight + (padding * 2);
    
    // Desenhar caixa de fundo
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...this.styles.colors.dark);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'FD');
    
    // Título da caixa
    doc.setFillColor(...this.styles.colors.dark);
    doc.roundedRect(margin, y, boxWidth, 10, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.text('RESUMO FINANCEIRO', pageWidth / 2, y + 7, { align: 'center' });
    
    // Adicionar valores
    let textY = y + padding + 14;
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    // Função para formatar valores monetários
    const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    
    // Valores parciais
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('TOTAL SELL OUT:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(formatCurrency(totals.sellOut), margin + boxWidth - padding - 50, textY, { align: 'right' });
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('TOTAL SELL IN:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(formatCurrency(totals.sellIn), margin + boxWidth - padding - 50, textY, { align: 'right' });
    textY += lineHeight;
    
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.text('TOTAL MERCHANDISING:', margin + padding, textY);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.text(formatCurrency(totals.merch), margin + boxWidth - padding - 50, textY, { align: 'right' });
    textY += lineHeight;
    
    // Linha separadora
    doc.setDrawColor(180, 180, 180);
    doc.line(margin + padding, textY - 1, margin + boxWidth - padding, textY - 1);
    
    // Total geral com destaque
    textY += 4;
    doc.setFont(this.styles.fonts.body, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.styles.colors.dark);
    doc.text('TOTAL GERAL:', margin + padding, textY);
    doc.text(formatCurrency(totals.total), margin + boxWidth - padding - 50, textY, { align: 'right' });
    
    return y + boxHeight;
  },
  
  // Adiciona seção de assinaturas estilizada
  addSignatureSection(doc, y, includeExtra) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const signWidth = 70;
    const signMargin = 10;
    const lineY = 20;
    
    // Título da seção
    doc.setFont(this.styles.fonts.header, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.styles.colors.dark);
    doc.text('Assinaturas', margin, y + 10);
    
    // Linha decorativa abaixo do título
    doc.setDrawColor(...this.styles.colors.dark);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 12, margin + 40, y + 12);
    
    // Calcular posições X para centralizar
    let startX;
    if (includeExtra) {
      // Três assinaturas
      startX = (pageWidth - (3 * signWidth + 2 * signMargin)) / 2;
    } else {
      // Duas assinaturas
      startX = (pageWidth - (2 * signWidth + signMargin)) / 2;
    }
    
    // Desenhar linhas de assinatura
    y += 30;
    doc.setLineWidth(0.5);
    
    // Primeira assinatura
    doc.line(startX, y, startX + signWidth, y);
    doc.setFont(this.styles.fonts.body, 'normal');
    doc.setFontSize(10);
    doc.text('RAFAEL SPERB', startX + signWidth/2, y + 5, { align: 'center' });
    
    // Segunda assinatura
    let secondX = startX + signWidth + signMargin;
    doc.line(secondX, y, secondX + signWidth, y);
    doc.text('WELLINGTON MARTINS', secondX + signWidth/2, y + 5, { align: 'center' });
    
    // Terceira assinatura (condicional)
    if (includeExtra) {
      let thirdX = secondX + signWidth + signMargin;
      doc.line(thirdX, y, thirdX + signWidth, y);
      doc.text('MARCIO MENDES', thirdX + signWidth/2, y + 5, { align: 'center' });
    }
  },
  
  // Adiciona anexos com página separadora
  async addAttachmentsWithSeparator(pdfDoc, fileList) {
    if (fileList && fileList.length > 0) {
      // Adicionar página separadora
      const separatorPage = pdfDoc.addPage([595, 841]);
      const { width, height } = separatorPage.getSize();
      
      // Título da seção de anexos
      const helveticaBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      separatorPage.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: PDFLib.rgb(0.2, 0.3, 0.4)
      });
      
      separatorPage.drawText('ANEXOS', {
        x: width / 2 - 60,
        y: height - 60,
        size: 36,
        font: helveticaBold,
        color: PDFLib.rgb(1, 1, 1)
      });
      
      // Adicionar os anexos
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
          
          // Calcular dimensões para caber na página com margens
          const margin = 50;
          const maxWidth = 595 - (margin * 2);
          const maxHeight = 841 - (margin * 2);
          
          const { width, height } = img.scaleToFit(maxWidth, maxHeight);
          
          const pg = pdfDoc.addPage([595, 841]);
          
          // Centralizar imagem na página
          pg.drawImage(img, {
            x: (595 - width) / 2,
            y: (841 - height) / 2,
            width,
            height
          });
        }
      }
    }
  },
  
  // Adiciona fotos de merchandising com layout melhorado
  async addEnhancedMerchandisingPhotos(pdfDoc, merchPhotosData) {
    const helvB = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    
    if (merchPhotosData.length > 0) {
      // Adicionar página separadora
      const separatorPage = pdfDoc.addPage([595, 841]);
      separatorPage.drawRectangle({
        x: 0,
        y: 741,
        width: 595,
        height: 100,
        color: PDFLib.rgb(0.95, 0.77, 0.06)
      });
      
      separatorPage.drawText('FOTOS DE MERCHANDISING', {
        x: 595 / 2 - 150,
        y: 791,
        size: 28,
        font: helvB,
        color: PDFLib.rgb(0.2, 0.2, 0.2)
      });
    }
    
    for (let i = 0; i < merchPhotosData.length; i++) {
      if (!merchPhotosData[i]) continue;
      
      const { dataUrl, type } = merchPhotosData[i];
      if (!dataUrl) continue;
      
      const img = type.includes('png')
        ? await pdfDoc.embedPng(dataUrl)
        : await pdfDoc.embedJpg(dataUrl);
        
      const pg = pdfDoc.addPage([595, 841]);
      
      // Cabeçalho estilizado
      pg.drawRectangle({
        x: 0,
        y: 791,
        width: 595,
        height: 50,
        color: PDFLib.rgb(0.95, 0.77, 0.06)
      });
      
      pg.drawText(`Foto de Merchandising ${i + 1}`, {
        x: 20,
        y: 816,
        size: 18,
        font: helvB,
        color: PDFLib.rgb(0.2, 0.2, 0.2)
      });
      
      // Calcular dimensões para caber na página com margens
      const margin = 50;
      const maxWidth = 595 - (margin * 2);
      const maxHeight = 700;  // Deixar espaço para o título
      
      const { width, height } = img.scaleToFit(maxWidth, maxHeight);
      
      // Adicionar borda decorativa em torno da imagem
      pg.drawRectangle({
        x: (595 - width - 10) / 2,
        y: (791 - height - 10) / 2 - 30,
        width: width + 10,
        height: height + 10,
        borderColor: PDFLib.rgb(0.95, 0.77, 0.06),
        borderWidth: 3,
        color: PDFLib.rgb(1, 1, 1)
      });
      
      // Desenhar a imagem centralizada
      pg.drawImage(img, {
        x: (595 - width) / 2,
        y: (791 - height) / 2 - 30,
        width,
        height
      });
      
      // Adicionar rodapé com informações
      pg.drawText(`Página ${i + 1} de ${merchPhotosData.filter(p => p).length}`, {
        x: 295,
        y: 30,
        size: 10,
        font: helv,
        color: PDFLib.rgb(0.5, 0.5, 0.5),
        align: 'center'
      });
    }
  },
  
  // Métodos auxiliares do código original mantidos
  readFileAsDataURL(file) {
    return new Promise(resolve => {
      if (!file) resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, type: file.type });
      reader.readAsDataURL(file);
    });
  },
  
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
  }
};
