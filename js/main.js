// main.js - Inicialização e controle geral da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Estado global da aplicação
    const appState = {
      dataLoaded: false,
      formModified: false
    };
    
    // Inicialização: adiciona primeiro item em cada tab
    initializeTabs();
    setupEventListeners();
    
    // Inicializa as tabs e seus conteúdos
    function initializeTabs() {
      // Cria item inicial para cada tab
      addItem('sell-out', false);
      addItem('sell-in', true);
      addMerchItem();
      
      // Configura tab navigation
      document.querySelectorAll('.tabs-nav li').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.tabs-nav li').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          
          document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.remove('active');
          });
          
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');
          
          const tabContentId = tab.dataset.tab;
          document.getElementById(tabContentId).classList.add('active');
        });
      });
    }
    
    // Adiciona listeners para todos os eventos da aplicação
    function setupEventListeners() {
      // Buttons para adicionar itens
      document.getElementById('add-item-sell-out').addEventListener('click', () => addItem('sell-out', false));
      document.getElementById('add-item-sell-in').addEventListener('click', () => addItem('sell-in', true));
      document.getElementById('add-merch-item').addEventListener('click', addMerchItem);
      
      // Event delegation para remoção de itens
      document.addEventListener('click', e => {
        // Remover item sell-out/sell-in
        if (e.target.closest('.remove-item')) {
          const container = e.target.closest('.items-container');
          const itemRow = e.target.closest('.item-row');
          
          UI.confirmRemove(() => {
            if (container.querySelectorAll('.item-row').length > 1) {
              itemRow.remove();
              Templates.renumberItems(container.id);
            } else {
              UI.showToast('Ao menos um item é obrigatório.', 'info');
            }
          });
        }
        
        // Remover item merchandising
        if (e.target.closest('.remove-merch-item')) {
          const container = document.getElementById('merch-items-container');
          const itemRow = e.target.closest('.merch-item-row');
          
          UI.confirmRemove(() => {
            if (container.querySelectorAll('.merch-item-row').length > 1) {
              itemRow.remove();
              Templates.renumberItems('merch-items-container');
            } else {
              UI.showToast('Ao menos um item é obrigatório.', 'info');
            }
          });
        }
      });
      
      // Event delegation para cálculo automático do valor da verba
      document.addEventListener('input', e => {
        if (e.target.matches('.item-unidades, .item-bonificacao')) {
          const row = e.target.closest('.item-row');
          const bonificacao = parseFloat(row.querySelector('.item-bonificacao').value) || 0;
          const unidades = parseFloat(row.querySelector('.item-unidades').value) || 0;
          row.querySelector('.item-verba').value = (bonificacao * unidades).toFixed(2);
          
          UI.updateSummary();
          appState.formModified = true;
        }
        
        if (e.target.matches('.merch-item-verba')) {
          UI.updateSummary();
          appState.formModified = true;
        }
        
        // Mostra campo personalizado quando "OUTRO" é selecionado
        if (e.target.matches('.merch-item-opcao')) {
          const row = e.target.closest('.merch-item-row');
          const customField = row.querySelector('.merch-custom-option');
          if (e.target.value === 'OUTRO') {
            customField.style.display = 'block';
            customField.querySelector('input').setAttribute('required', '');
          } else {
            customField.style.display = 'none';
            customField.querySelector('input').removeAttribute('required');
          }
        }
      });
      
      // Mostra previews de imagens
      // document.addEventListener('change', e => {
     //   if (e.target.matches('.merch-item-photo')) {
       //   const previewContainer = e.target.closest('.form-group').querySelector('.image-preview');
      //    UI.showFilePreview(e.target, previewContainer);
     //   }
        
     //   if (e.target.matches('#dossie_files')) {
      //    UI.showFilePreview(e.target, document.getElementById('file-preview'));
     //   }
   //   });
      
      // Validação de formulário no submit
      document.getElementById('form-dossie').addEventListener('submit', async e => {
        e.preventDefault();
        
        if (!Validation.validateForm(e.target)) {
          return;
        }
        
        // Coleta dados do formulário
        const formData = new FormData(e.target);
        const formDataObj = {};
        
        for (const [key, value] of formData.entries()) {
          if (!key.includes('[]')) {
            formDataObj[key] = value;
          }
        }
        
        // Adiciona os arquivos selecionados
        formDataObj.dossie_files = e.target.dossie_files.files;
        
        // Gera o PDF
        const success = await PDFGenerator.generateDossie(formDataObj);
        if (success) {
          appState.formModified = false;
        }
      });
      
      // Botão DocuSign
      document.getElementById('btn-docusign').addEventListener('click', () => {
        // Implementação futura da integração com DocuSign
        UI.showToast('Funcionalidade de assinatura ainda em desenvolvimento.', 'info');
      });
      
      // Aviso ao sair da página com alterações não salvas
      window.addEventListener('beforeunload', e => {
        if (appState.formModified) {
          const message = 'Existem alterações não salvas. Deseja realmente sair?';
          e.returnValue = message;
          return message;
        }
      });
    }
    
    // Função para adicionar novo item sell-out/sell-in
    function addItem(type, isSellIn) {
      const { clone, itemId } = Templates.createItem(type, isSellIn);
      const container = document.getElementById(`items-container-${type}`);
      
      container.appendChild(clone);
      
      // Configura os selects de família/produto
      const newRow = container.querySelector(`[data-id="${itemId}"]`);
      bindFamilyProductSelects(newRow, isSellIn);
      
      UI.updateSummary();
      appState.formModified = true;
    }
    
    // Função para adicionar novo item merchandising
    function addMerchItem() {
      const { clone, itemId } = Templates.createMerchItem();
      const container = document.getElementById('merch-items-container');
      
      container.appendChild(clone);
      
      UI.updateSummary();
      appState.formModified = true;
    }
    
    // Função para vincular os selects de família e produto
    function bindFamilyProductSelects(row, isSellIn = false) {
      const famName = isSellIn ? 'item_familia_in[]' : 'item_familia[]';
      const prodName = isSellIn ? 'item_produto_in[]' : 'item_produto[]';
      
      const famSelect = row.querySelector(`select[name="${famName}"]`);
      const prodSelect = row.querySelector(`select[name="${prodName}"]`);
      
      // Limpa qualquer opção existente e adiciona as novas
      famSelect.innerHTML = '<option value="">Selecione…</option>';
      
      // Adiciona as opções de família
      familias.forEach(familia => {
        const option = document.createElement('option');
        option.textContent = familia;
        option.value = familia;
        famSelect.appendChild(option);
      });
      
      // Quando a família muda, atualiza produtos
      famSelect.addEventListener('change', () => {
        const familia = famSelect.value;
        const produtos = produtosPorFamilia[familia] || [];
        
        // Limpa o select de produtos
        prodSelect.innerHTML = '<option value="">Selecione…</option>';
        
        // Adiciona os produtos da família selecionada
        produtos.forEach(produto => {
          const option = document.createElement('option');
          option.textContent = produto;
          option.value = produto;
          prodSelect.appendChild(option);
        });
      });
    }
  });
