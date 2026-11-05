/* G89: grup içi kaydırma yok; panel normal akışta ve içerik yüksekliğiyle sınırlı.
   Ölçülen sınır CSSOM kuralıdır, HTML'e satır içi stil/sabit yükseklik yazılmaz. */
(function () {
  'use strict';
  var panel = document.getElementById('lstSide');
  var content = document.querySelector('.lst-main');
  if (!panel || !content) return;
  var style = document.createElement('style');
  document.head.appendChild(style);
  style.sheet.insertRule('@media (min-width:1025px) { #lstSide { max-height:none; overflow-y:auto; } }');
  var rule = style.sheet.cssRules[0].cssRules[0];
  function measure() {
    var height = content.getBoundingClientRect().height;
    if (height > 0) rule.style.maxHeight = height + 'px';
  }
  function states() {
    panel.querySelectorAll('.fct').forEach(function (group) {
      var head = group.querySelector('.fct-head');
      var more = group.querySelector('.fct-more');
      if (head) head.setAttribute('aria-expanded', String(group.classList.contains('open')));
      if (more) more.setAttribute('aria-expanded', String(group.classList.contains('more-open')));
    });
  }
  // Aç/kapa mevcut kanon işleyicisinde kalır; ikinci click işleyicisi eklenmez.
  new MutationObserver(states).observe(panel, {subtree:true, attributes:true, attributeFilter:['class']});
  if (window.ResizeObserver) new ResizeObserver(measure).observe(content);
  window.addEventListener('resize', measure);
  states(); measure();
})();
