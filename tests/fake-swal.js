import Swal from 'sweetalert2/dist/sweetalert2';

let promptInput = '';

export const setFakePromptInput = input => {
  promptInput = input;
};

export const swalConfirmed = {
  fire: options => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (options.input) {
        resolve(promptInput);
      } else {
        resolve({value: true, dismiss: Swal.DismissReason.close});
      }
    }, 0);
  })
};

export const swalCanceled = {
  fire: options => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (options.input) {
        resolve('');
      } else {
        resolve({value: false, dismiss: Swal.DismissReason.cancel});
      }
    }, 0);
  })
};
