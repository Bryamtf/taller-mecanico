import Swal from 'sweetalert2';

export const swal = Swal.mixin({
  confirmButtonColor: '#e5ba4a',
  cancelButtonColor: '#6b7280',
  customClass: { popup: 'font-alro' },
});

export const swalSuccess = (title, text) =>
  swal.fire({ icon: 'success', title, text });

export const swalError = (title, text) =>
  swal.fire({ icon: 'error', title, text });

export const swalConfirm = (title, text) =>
  swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'Cancelar',
  });
