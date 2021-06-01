import './scss/style.scss';

import handleData from './js/modules/handleData';
import graph from './js/modules/graph';

window.addEventListener('DOMContentLoaded', () => {

  const dataSubmit = document.querySelector('.js__btn');

  dataSubmit.addEventListener('click', function (e) {

    preventDefaults(e);
    let dataArea = document.querySelector('.js__textarea').value;
    let processedData = handleData(dataArea);
    graph({
      data: processedData ,
      container: '.js__frame',
      legendContainer: '.js__legend',
      verticalGap: 50,
      horizontalGap: 30,
      pathWidth: 6,
      circleRadius: 10,
      paddingTop: 0,
      paddingLeft: 15
    });
    this.blur();
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
});
