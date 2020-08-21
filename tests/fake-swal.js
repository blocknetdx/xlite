let promptInput = '';

export const setFakePromptInput = input => {
  promptInput = input;
};

export const swalConfirmed = options => new Promise((resolve, reject) => {
  if(
    options.content && Object.keys(options.content).length === 0
    || options.buttons && options.buttons.length < 2
  ) reject('Invalid options');
  setTimeout(() => {
    if(options.content && options.content.element === 'input') {
      resolve(promptInput);
    } else {
      resolve(true);
    }
  }, 0);
});

export const swalCanceled = options => new Promise((resolve, reject) => {
  if(
    options.content && Object.keys(options.content).length === 0
    || options.buttons && options.buttons.length < 2
  ) reject('Invalid options');
  setTimeout(() => {
    if(options.content && options.content.element === 'input') {
      resolve('');
    } else {
      resolve(false);
    }
  }, 0);
});
