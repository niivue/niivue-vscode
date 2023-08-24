import { Niivue, NVImage } from '@niivue/niivue';
import './index.css';

let nv = new Niivue({ isResizeCanvas: false });
nv.attachTo("gl");

// https://stackoverflow.com/questions/41336301/typescript-cannot-find-name-window-or-document
window.addEventListener('message', async (e) => {
    const { type, body } = e.data;
    switch (type) {
        case 'init':
            {
                let image = new NVImage(body.data, body.uri);
                nv.addVolume(image);
            }
            break;
    }
});

function controlFromInput(fromSlider: any, fromInput: any, toInput: any, controlSlider: any) {
    const [from, to] = getParsed(fromInput, toInput);
    fillSlider(fromInput, toInput, '#C6C6C6', '#25daa5', controlSlider);
    if (from > to) {
        fromSlider.value = to;
        fromInput.value = to;
    } else {
        fromSlider.value = from;
    }
}
    
function controlToInput(toSlider: any, fromInput: any, toInput: any, controlSlider: any) {
    const [from, to] = getParsed(fromInput, toInput);
    fillSlider(fromInput, toInput, '#C6C6C6', '#25daa5', controlSlider);
    setToggleAccessible(toInput);
    if (from <= to) {
        toSlider.value = to;
        toInput.value = to;
    } else {
        toInput.value = from;
    }
}

function controlFromSlider(fromSlider: any, toSlider: any, fromInput: any) {
  const [from, to] = getParsed(fromSlider, toSlider);
  fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
  if (from > to) {
    fromSlider.value = to;
    fromInput.value = to;
  } else {
    fromInput.value = from;
  }
}

function controlToSlider(fromSlider: any, toSlider: any, toInput: any) {
  const [from, to] = getParsed(fromSlider, toSlider);
  fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
  setToggleAccessible(toSlider);
  if (from <= to) {
    toSlider.value = to;
    toInput.value = to;
  } else {
    toInput.value = from;
    toSlider.value = from;
  }
}

function getParsed(currentFrom: any, currentTo: any) {
  const from = parseInt(currentFrom.value, 10);
  const to = parseInt(currentTo.value, 10);
  return [from, to];
}

function fillSlider(from: any, to: any, sliderColor: any, rangeColor: any, controlSlider: any) {
    const rangeDistance = to.max-to.min;
    const fromPosition = from.value - to.min;
    const toPosition = to.value - to.min;
    controlSlider.style.background = `linear-gradient(
      to right,
      ${sliderColor} 0%,
      ${sliderColor} ${(fromPosition)/(rangeDistance)*100}%,
      ${rangeColor} ${((fromPosition)/(rangeDistance))*100}%,
      ${rangeColor} ${(toPosition)/(rangeDistance)*100}%, 
      ${sliderColor} ${(toPosition)/(rangeDistance)*100}%, 
      ${sliderColor} 100%)`;
}

function setToggleAccessible(currentTarget: any) {
  const toSlider = document.querySelector('#toSlider') as HTMLInputElement;
  if (Number(currentTarget.value) <= 0 ) {
    toSlider!.style.zIndex = '2';
  } else {
    toSlider!.style.zIndex = '0';
  }
}

const fromSlider = document.querySelector('#fromSlider') as HTMLInputElement;
const toSlider = document.querySelector('#toSlider') as HTMLInputElement;
const fromInput = document.querySelector('#fromInput') as HTMLInputElement;
const toInput = document.querySelector('#toInput') as HTMLInputElement;
fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
setToggleAccessible(toSlider);

fromSlider!.oninput = () => controlFromSlider(fromSlider, toSlider, fromInput);
toSlider!.oninput = () => controlToSlider(fromSlider, toSlider, toInput);
fromInput!.oninput = () => controlFromInput(fromSlider, fromInput, toInput, toSlider);
toInput!.oninput = () => controlToInput(toSlider, fromInput, toInput, toSlider);