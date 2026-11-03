import { createModel } from './model.js';
import { drawWheel } from './wheel.js';

const response = await fetch('./data/willcox.json', { cache: 'no-cache' });
if (!response.ok) throw new Error('The wheel data could not load.');

const panel = document.getElementById('definition');
const word = document.getElementById('definition-word');
const description = document.getElementById('definition-text');
const wheel = drawWheel(document.getElementById('wheel'), createModel(await response.json()), node => {
  if (node) {
    word.textContent = node.label;
    description.textContent = node.description || 'No definition is available for this word.';
  }
  panel.hidden = !node;
});
document.getElementById('definition-close').addEventListener('click', () => wheel.clearSelection());
document.addEventListener('click', event => {
  if (!event.target.closest('.sector, #definition, #theme-toggle')) wheel.clearSelection(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !panel.hidden) wheel.clearSelection();
});
