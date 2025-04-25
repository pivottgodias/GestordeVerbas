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
