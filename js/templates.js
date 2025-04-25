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
