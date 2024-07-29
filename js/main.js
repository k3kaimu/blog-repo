/**
 * some JavaScript code for this blog theme
 */
/* jshint asi:true */

/////////////////////////header////////////////////////////
/**
 * clickMenu
 */
(function() {
  if (window.innerWidth <= 770) {
    var menuBtn = document.querySelector('#headerMenu')
    var nav = document.querySelector('#headerNav')
    menuBtn.onclick = function(e) {
      e.stopPropagation()
      if (menuBtn.classList.contains('active')) {
        menuBtn.classList.remove('active')
        nav.classList.remove('nav-show')
      } else {
        nav.classList.add('nav-show')
        menuBtn.classList.add('active')
      }
    }
    document.querySelector('body').addEventListener('click', function() {
      nav.classList.remove('nav-show')
      menuBtn.classList.remove('active')
    })
  }
}());

//////////////////////////back to top////////////////////////////
(function() {
  var backToTop = document.querySelector('.back-to-top');
  var backToTopA = document.querySelector('.back-to-top a');
  if(!!!backToTop || !!!backToTopA)
      return;

  // console.log(backToTop);
  window.addEventListener('scroll', function() {

    // 页面顶部滚进去的距离
    var scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop)

    if (scrollTop > 200) {
      backToTop.classList.add('back-to-top-show')
    } else {
      backToTop.classList.remove('back-to-top-show')
    }
  })

  // backToTopA.addEventListener('click',function (e) {
  //     e.preventDefault()
  //     window.scrollTo(0,0)
  // })
}());

//////////////////////////hover on demo//////////////////////////////
(function() {
  var demoItems = document.querySelectorAll('.grid-item')
}());

/** Header hover anchor links **/
(function(){
  'use strict';

  /*
  Create intra-page links
  Requires that your headings already have an `id` attribute set (because that's what jekyll does)
  For every heading in your page, this adds a little anchor link `#` that you can click to get a permalink to the heading.
  Ignores `h1`, because you should only have one per page.
  The text content of the tag is used to generate the link, so it will fail "gracefully-ish" if you have duplicate heading text.
   */

  var headingNodes = [], results, link, falink,
      tags = ['h2', 'h3', 'h4', 'h5', 'h6'];

  tags.forEach(function(tag){
    results = document.getElementsByTagName(tag);
    Array.prototype.push.apply(headingNodes, results);
  });

  headingNodes.forEach(function(node){
    link = document.createElement('a');
    link.href = '#' + node.getAttribute('id');
    
    falink = document.createElement('i');
    falink.className ='fa fa-link';
    link.appendChild(falink);
    node.appendChild(link);
  });

})();



function processTasksOnIdle(tasks, onFinish)
{
    if(tasks.length == 0) {
        onFinish();
        return;
    }

    async function runTasks(deadline) {
        while(tasks.length && deadline.timeRemaining() > 0){
            let task = tasks.shift();
            await task();
        }
        
        if(tasks.length){
            requestIdleCallback(runTasks);
        } else {
            if(onFinish)
                onFinish();
        }
    }


    requestIdleCallback(runTasks);
}


async function loadWASM(path, importObject)
{
    return fetch(path)
    .then(res => { console.log(res); return res.arrayBuffer();} )
    .then(bytes => WebAssembly.instantiate(bytes, importObject).then(result => result.instance))
}
