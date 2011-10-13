var assert = require('assert');
var fs = require('fs');
var jsHtml = require('../main');
var util = require('../lib/util');
var srcDir = __dirname + '/../examples/';
var testData = require('./testData');

var templateList	=	[];
var templateIndex	=	0;
var templateCount	=	templateList.length;

var iterationCount	=	100;
var iterationIndex	=	0;

var timeOffset;
var template;


function begin()	{
	timeOffset = new Date();

	jsHtml.renderAsync(write, end, template.content, testData);
}

function write()	{
	template.writeCount += arguments.length;
}

function end()	{
	write.apply(this, arguments);
	template.totalDuration += new Date().valueOf() - timeOffset.valueOf();
	
	next();
}

function next()	{
	var fn = begin;
	if(templateIndex == 0)	{
		templateList.sort(function(a, b) {return 1 - 2 * Math.random();});
	}
	
	template = templateList[templateIndex];
	
	templateIndex ++;
	if(templateIndex < templateCount)	{
	}
	else	{
		templateIndex = 0;

		iterationIndex ++;
		if(iterationIndex < iterationCount)	{
		}
		else	{
			iterationIndex = 0;
			stop = true;
			fn = finish;
		}
	}
	fn();
}

function finish()	{
	console.log(iterationCount + ' iterations');
	console.log('writes\tms\texample');
	templateList.sort(function(a, b) {return a.totalDuration - b.totalDuration});
	templateList.forEach(function(template)	{
		console.log(template.writeCount + '\t' + template.totalDuration + '\t' + template.name);
	});
}

fs.readdirSync(srcDir).forEach(function(file)	{
	var match = /(.+)\.jshtml$/i.exec(file);
	if (!match) return;
	
	var content = fs.readFileSync(srcDir + match[1] + '.jshtml', 'utf8');
	templateList.push({
		name: match[1]
		, content: content
		, totalDuration: 0
		, writeCount: 0
	});
	templateCount++;
});

next();


