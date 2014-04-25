var submittable = require('submittable');
var events = require('event')
var value = require('value');
var uid = require('uid');

/**
 * Expose `multipart`
 */

module.exports = multipart;

/**
 * Submit `form` and call `fn`
 *
 * @param {Element} form
 * @param {Object} opts
 * @param {Function} fn
 * @api public
 */

function multipart (form, opts, fn) {
  if (typeof opts === 'function') {
    fn = opts;
    opts = {param: 'iframe=1'};
  }
  var name = uid();
  
  // append a flag to url
  var action = form.action;
  if (opts.param) {
    action += ~action.indexOf('?')
      ? '&' + opts.param
      : '?' + opts.param;
  }
  
  var shadow = document.createElement('form');
  shadow.style.display = 'none';
  shadow.target = name;
  shadow.action = action;
  shadow.method = 'POST'
  shadow.encoding = shadow.enctype = 'multipart/form-data';
  
  // thanks, IE!
  var div = document.createElement('div');
  div.innerHTML = '<iframe name="' + name + '" />';
  
  var iframe = div.firstChild;
  iframe.src = 'javascript:false';
  events.bind(iframe, 'load', ready);
  shadow.appendChild(iframe);
  document.body.appendChild(shadow);
  
  /**
   * Fires when the iframe is loaded
   *
   * @api private
   */
  
  function ready () {
    var inputs = [];
    var els = form.elements;
    
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      
      // file input
      if (el.type == 'file') {
        var clone = el.cloneNode(false);
        el.parentNode.insertBefore(clone, el);
        el.removeAttribute('form');
        shadow.appendChild(el);
        inputs.push([clone, el]);
        continue;
      }
    
      // regular input
      if (submittable(el)) {
        var clone = document.createElement('input');
        clone.type = 'hidden';
        clone.name = el.name;
        clone.value = value(el);
        shadow.appendChild(clone);
      }
    }
    
    events.unbind(iframe, 'load', ready);
    events.bind(iframe, 'load', done);
    
    shadow.submit();
    restore(inputs);
  }
  
  /**
   * Restore original file inputs
   *
   * @param {Array} inputs
   * @api private
   */
  
  function restore (inputs) {
    for (var i = 0; i < inputs.length; i++) {
      var clone = inputs[i][0];
      var input = inputs[i][1];
      clone.parentNode.insertBefore(input, clone);
      clone.parentNode.removeChild(clone);
    }
  }
  
  /**
   * Fires when the response is ready
   *
   * @api private
   */
  
  function done () {
    var err;
    
    // fix for endless progress bar (IE)
    var fix = document.createElement('iframe');
    fix.src = 'javascript:false';
    shadow.appendChild(fix);
    
    try {
      var win = iframe.contentDocument || iframe.contentWindow;
      var res = win.body || win.document.body;
      if (res.innerHTML) var innerHTML = res.innerHTML;
    } catch (e) {
      err = e;
    }
    
    document.body.removeChild(shadow);
    events.unbind(iframe, 'load', done);
    
    fn(err, innerHTML, res);
  }
}
