'use strict';

var canvasUtilities = require('canvas-utilities/lib/utilities.js');
var debug = require('debug');
var elephantine = require('elephantine');
var URI = require('urijs');
require('urijs/src/URI.fragmentQuery.js');
var $ = require('jquery');
require('jquery-textrange');
var _ = require('lodash');

debug.enable('elephantine:*');

function asyncDebounce(func) {
  var delayedFunc = null;
  var executing = false;

  return function debounced() {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    var nargs = args.length;
    var callback = args[nargs - 1];

    function delayed() {
      executing = true;
      func.apply(self, args);
    }

    args[nargs - 1] = function () {
      callback.apply(self, arguments);
      executing = false;

      if (delayedFunc) {
        delayedFunc();
      }

      delayedFunc = null;
    };

    if (executing) {
      delayedFunc = delayed;
    } else {
      delayed();
    }
  };
}

var symbols = _.uniq(elephantine.system.emojiSymbols
  .concat(elephantine.system.symbolsByTag.setting));

symbols.forEach(function (symbol) {
  $('#symbols').append(`<div class="no-select">${symbol}</div>`);
});

$('#symbols > div').click(function () {
  $('#curve').textrange('insert', $(this).text());
  $('#curve').textrange('setcursor', $('#curve').textrange('get', 'end'));
});

var old;

function upscale(canvas, ctx) {
  var devicePixelRatio = window.devicePixelRatio || 1;
  var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                          ctx.mozBackingStorePixelRatio ||
                          ctx.msBackingStorePixelRatio ||
                          ctx.oBackingStorePixelRatio ||
                          ctx.backingStorePixelRatio || 1;

  var ratio = devicePixelRatio / backingStoreRatio;

  // upscale the canvas if the two ratios don't match
  if (devicePixelRatio !== backingStoreRatio) {
    var oldWidth = canvas.width;
    var oldHeight = canvas.height;

    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    // now scale the context to counter
    // the fact that we've manually scaled
    // our canvas element
    ctx.scale(ratio, ratio);
  }
}

var debouncedRender = asyncDebounce(elephantine.render);

function render(force) {
  var curve = $('#curve').val();

  if (curve === old && !force) {
    return;
  }

  old = curve;

  location.href = URI(location.href).fragment({curve: curve}).toString();

  console.log('rendering', curve);

  var canvas = document.getElementById('canvas');
  var ctx = canvasUtilities.getContext(canvas);

  var width = $('#canvas').width();
  var height = $('#canvas').height();

  debouncedRender(ctx, curve, width, height, 100000, true,
    function (err, globals) {
      console.log('finished', globals);
    });
}

function resize() {
  var canvas = document.getElementById('canvas');
  var ctx = canvasUtilities.getContext(canvas);

  var parentWidth = $('#canvas').parent().innerWidth();
  var parentHeight = $('#canvas').parent().innerHeight();

  canvas.width = parentWidth;
  canvas.height = parentHeight;

  $('#canvas').attr('width', parentWidth);
  $('#canvas').attr('height', parentHeight);

  upscale(canvas, ctx);

  render(true);
}

$(window).resize(resize);

var uri = URI(location.href);
var fragment = uri.fragment(true);

var curve;

if (fragment.curve) {
  curve = fragment.curve;
} else {
  curve = elephantine.generate().replace(/; /g, '\n');
}

$('#curve').val(curve);

$('#curve').on('keyup', _.debounce(_.ary(render, 0), 500));

$(document).ready(resize);
