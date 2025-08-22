// Clipboard utility library for Hey Dont Forget
// Handles copying reference text to clipboard with confirmation

// Copy text to clipboard and show confirmation
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

// Copy reference text with confirmation
export async function copyReference(reference) {
  if (!reference || reference.trim() === '') {
    return false;
  }
  
  const success = await copyToClipboard(reference.trim());
  
  if (success) {
    showCopyConfirmation();
  }
  
  return success;
}

// Show copy confirmation message
function showCopyConfirmation() {
  // Create confirmation element
  const confirmation = document.createElement('div');
  confirmation.className = 'copy-confirmation';
  confirmation.textContent = 'Reference copied';
  
  // Style the confirmation
  confirmation.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10000;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  `;
  
  // Add to page
  document.body.appendChild(confirmation);
  
  // Animate in
  setTimeout(() => {
    confirmation.style.opacity = '1';
    confirmation.style.transform = 'translateY(0)';
  }, 10);
  
  // Remove after 2 seconds
  setTimeout(() => {
    confirmation.style.opacity = '0';
    confirmation.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (confirmation.parentNode) {
        confirmation.parentNode.removeChild(confirmation);
      }
    }, 300);
  }, 2000);
}

// Copy reference from reminder object
export async function copyReminderReference(reminder) {
  if (!reminder || !reminder.reference) {
    return false;
  }
  
  return await copyReference(reminder.reference);
}
