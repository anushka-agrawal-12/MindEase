(function(){
  var show=['calm','anxious','tired','happy','grateful'];
  var chips=document.getElementById('chips'),say=document.getElementById('say'),hero=document.getElementById('heroMo');
  document.getElementById('logoMo').innerHTML=MI.face('happy',{halo:false});
  chips.innerHTML=show.map(function(k){var m=MI.get(k);return '<button class="chip" role="radio" aria-checked="false" data-k="'+k+'">'+m.label+'</button>';}).join('');
  function pick(k,animate){
    var m=MI.setMood(k,true);
    hero.innerHTML=MI.face(k,{cls:animate?'mo-pop':'',idle:true});
    if(animate){MI.sound.mood(k);MI.fx.bloom(hero);}
    say.textContent=m.say;
    chips.querySelectorAll('.chip').forEach(function(c){c.setAttribute('aria-checked',c.dataset.k===k?'true':'false');});
  }
  chips.addEventListener('click',function(e){var b=e.target.closest('.chip');if(b)pick(b.dataset.k,true);});
  MI.sound.mount(document.getElementById('sndHost'));
  document.addEventListener('click',function(e){if(!e.target.closest('.snd')&&e.target.closest('.btn,.room,.chip'))MI.sound.sfx('tap');});
  MI.fx.fireflies(9);MI.fx.shootingStars();
  Array.prototype.forEach.call(document.querySelectorAll('.hero > div:first-child > *'),function(el,i){el.classList.add('enter');el.style.animationDelay=(i*0.12)+'s';});
  Array.prototype.forEach.call(document.querySelectorAll('.room, .steps li'),function(el){el.classList.add('rv');});
  MI.fx.reveal('.rv');
  var s=MI.saved();pick(show.indexOf(s)>-1?s:'calm',false);
})();
