export function showToast(msg: string): void {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-msg");
  if (msgEl) msgEl.innerText = msg;
  if (toast) {
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

export function showErrorModal(title: string, message: string): void {
  const modal = document.getElementById("error-modal");
  const titleEl = document.getElementById("error-modal-title");
  const msgEl = document.getElementById("error-modal-msg");
  if (titleEl)
    titleEl.innerHTML = `<i class="fas fa-exclamation-triangle" aria-hidden="true"></i> ${title}`;
  if (msgEl) msgEl.innerText = message;
  if (modal) modal.style.display = "flex";
}

export function hideErrorModal(): void {
  const modal = document.getElementById("error-modal");
  if (modal) modal.style.display = "none";
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
