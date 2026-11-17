const plant = document.querySelector('#plant');
if (plant) {
  let planted = 0;
  plant.addEventListener('click', () => {
    const flower = document.createElement('span');
    flower.className = 'bloom';
    flower.textContent = '✳';
    const label = document.createElement('small');
    label.textContent = document.querySelector('#seed').value;
    flower.append(label);
    document.querySelector('#flowers').append(flower);
    planted++;
    document.querySelector('#garden-status').textContent = 'You planted ' + label.textContent + '. A small thought, with room to grow.';
    if (planted === 6) {
      plant.disabled = true;
      document.querySelector('#garden-status').textContent = 'Your little garden is full. Take a moment to enjoy it.';
    }
  });
}
const form = document.querySelector('#letter-form');
if (form) {
  const input = document.querySelector('#letter');
  const folded = document.querySelector('#folded-letter');
  const preview = document.querySelector('#letter-preview');
  const unfold = document.querySelector('#unfold');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!input.value.trim()) { input.setCustomValidity('Write a small thought first.'); input.reportValidity(); return; }
    preview.textContent = input.value.trim();
    preview.hidden = true;
    form.hidden = true;
    folded.hidden = false;
    unfold.textContent = 'Open my letter ↗';
    document.querySelector('#letter-status').textContent = 'Folded for now. You can open it whenever you are ready.';
    unfold.focus();
  });
  input.addEventListener('input', () => input.setCustomValidity(''));
  unfold.addEventListener('click', () => {
    preview.hidden = !preview.hidden;
    unfold.textContent = preview.hidden ? 'Open my letter ↗' : 'Fold it again ↗';
  });
  document.querySelector('#rewrite').addEventListener('click', () => {
    folded.hidden = true;
    form.hidden = false;
    document.querySelector('#letter-status').textContent = '';
    input.focus();
  });
}
