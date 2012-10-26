/*!
 * jshtml
 * Copyright(c) 2011 Elmer Bulthuis <elmerbulthuis@gmail.com>
 * MIT Licensed
 */

var fs = require('fs');
var assert = require('assert');
var JsHtmlParser = require('./lib/JsHtmlParser');
var util = require('./lib/util');


var cache = {};

function __express(filename, options, callback, ispartial) {
    var template = fs.readFileSync(filename, 'utf-8');
    var buffer = '';
    var atEnd = false;

    function write()	{
            var argumentCount = arguments.length;
            for(var argumentIndex = 0; argumentIndex < argumentCount; argumentIndex++){
                    var argument = arguments[argumentIndex];
                    buffer += util.str(argument);                    
            }
    }
    function end()	{
            write.apply(this, arguments);
            atEnd = true;
    }
    compileAsync(template, options).call(this, write, end, options || {});

    assert.ok(atEnd, 'not ended');
    if (ispartial === true) return buffer;
    callback(null, buffer);
    return true;
}

function render(template, options) {
	var options = util.extend({}, options);
	var fn = options.filename 
		? (cache[options.filename] || (cache[options.filename] = __express(template, options, callback)))
		: __express(template, options, callback);
	return fn.call(options.scope, options.locals || {});
}



var cacheAsync = {};

function compileAsync(template, options) {
	var fnSrc = '';
	var parser = new JsHtmlParser(function(data) {
		fnSrc += data;
	}, options);
	parser.end(template);
	if(options.with)	{
		fnSrc = '{' + fnSrc + '}';
		var contextList = Array.isArray()
		? options.with
		: [options.with];
		contextList.forEach(function(context){
			fnSrc = 'with(' + context + ')' + fnSrc;
		});
	}        
	var fn = new Function('write', 'end', 'tag', 'writePartial', 'writeBody', 'util', 'locals', fnSrc);

	return function(writeCallback, endCallback, locals) {

		function tag(tagName) {
			var tagAttributeSetList = [];
			var tagContentList = [];
			var argumentCount = arguments.length;
			var hasContent = false;
			for(var argumentIndex = 1; argumentIndex < argumentCount; argumentIndex++){
				var argument = arguments[argumentIndex];
				switch(typeof argument) {
					case 'object':
					tagAttributeSetList.push(argument);
					break;

					default:
					hasContent = true;
					tagContentList.push(argument);
				}
			}

			writeCallback.call(this, '<', tagName);
			tagAttributeSetList.forEach(function(tagAttributeSet) {
				writeCallback.call(this, ' ', util.htmlAttributeEncode(tagAttributeSet));
			});
			if(hasContent) {
				writeCallback.call(this, '>');

				tagContentList.forEach(function(tagContent) {
					switch(typeof tagContent) {
						case 'function':
						tagContent();
						break;

						default:
						writeCallback.call(this, util.htmlLiteralEncode(tagContent));
					}
				});

				writeCallback.call(this, '</', tagName, '>');
			}
			else{
				writeCallback.call(this, ' />');
			}
		}

		function writePartial() {        
                       writeCallback.call(this, __express(locals.settings.views + '/' + arguments[0]+'.jshtml', arguments[1] || {}, null, true));
		}

		function writeBody() {
			writeCallback.call(this, locals.body);
		}

		fn.call(this, writeCallback, endCallback, tag, writePartial, writeBody, util, locals);
	};
}

function renderAsync(writeCallback, endCallback, filename, options) {
        var template = fs.readFileSync(filename, 'utf-8');
	var options = util.extend({}, options);
	var fn = options.filename 
		? (cacheAsync[options.filename] || (cacheAsync[options.filename] = compileAsync(template, options)))
		: compileAsync(template, options)
		;
	fn.call(options.scope, writeCallback, endCallback, options.locals || {});
}


//require
require.extensions['.jshtml'] = function(module, fileName) {
    var template = fs.readFileSync(fileName, 'utf-8');
	module.exports = compileAsync(template, {});
}

//exports
exports.compileAsync = compileAsync;
exports.renderAsync = renderAsync;
exports.__express = __express;
exports.render = render;