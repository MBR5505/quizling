/**
 * Main JavaScript file for IT Quiz application
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('IT Quiz application loaded');
  
  // Enable Bootstrap tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  if (tooltipTriggerList.length > 0) {
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
  }
  
  // Enable Bootstrap popovers
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
  if (popoverTriggerList.length > 0) {
    [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
  }
  
  // Auto dismiss alerts after 5 seconds
  setTimeout(function() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(function(alert) {
      if (bootstrap && bootstrap.Alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    });
  }, 5000);
  
  // Handle form validation styling
  const forms = document.querySelectorAll('.needs-validation');
  if (forms.length > 0) {
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }
});

/**
 * Helper function to show an alert message
 * @param {string} message - The message to display
 * @param {string} type - Alert type (success, danger, warning, info)
 * @param {string} containerId - ID of the container to show the alert in
 */
function showAlert(message, type = 'info', containerId = 'alert-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  container.appendChild(alertDiv);
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    const bsAlert = new bootstrap.Alert(alertDiv);
    bsAlert.close();
  }, 5000);
}

/**
 * Helper function to make API requests
 * @param {string} url - The URL to fetch
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - The data to send (for POST/PUT requests)
 * @returns {Promise} - Promise with the response data
 */
async function apiRequest(url, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Noe gikk galt');
    }
    
    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
