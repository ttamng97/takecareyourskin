fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBuuvUUhuOlIGL1i5Z0CFkndemWzxhoHyU')
  .then(r=>r.json())
  .then(d => {
     console.log(d.models.map(m=>m.name).join(', '));
  });
