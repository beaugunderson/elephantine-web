'use strict';

var canvasUtilities = require('canvas-utilities/lib/utilities.js');
var debug = require('debug');
var elephantine = require('elephantine');
var URI = require('urijs');
require('urijs/src/URI.fragmentQuery.js');
var $ = require('jquery');
var _ = require('lodash');

debug.enable('elephantine:*');

var symbols = _.uniq(elephantine.system.emojiSymbols
  .concat(elephantine.system.symbolsByTag.setting));

symbols.forEach(function (symbol) {
  $('#symbols').append(`<div>${symbol}</div>`);
});

var old;

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

  console.log('width, height', width, height);

  elephantine.render(ctx, curve, width, height, 10000);
}

function resize() {
  var canvas = document.getElementById('canvas');

  canvas.width = $('#canvas').width();
  canvas.height = $('#canvas').height();

  $('#canvas').attr('width', $('#canvas').width());
  $('#canvas').attr('height', $('#canvas').height());

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

resize();
