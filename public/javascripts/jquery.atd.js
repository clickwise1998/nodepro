/*
 * atd.core.js - A building block to create a front-end for AtD (from http://github.com/Automattic/atd-core, incorporated here).
 * Author      : Raphael Mudge
 * License     : LGPL
 * Project     : http://open.afterthedeadline.com
 * Discuss     : https://groups.google.com/forum/#!forum/atd-developers
 *
 * Derived from:
 *
 * jquery.spellchecker.js - a simple jQuery Spell Checker
 * Copyright (c) 2008 Richard Willis
 * MIT license  : http://www.opensource.org/licenses/mit-license.php
 * Project      : http://jquery-spellchecker.googlecode.com
 * Contact      : willis.rh@gmail.com
 */

function AtD_Basic() {
	this.rpc = ''; /* see the proxy.php that came with the AtD/TinyMCE plugin */
	this.api_key = '';
	this.i18n = {};
	this.listener = {};

	/* callbacks */
        this.delCount=0;
        this.inputCount=0;
        this.copyCount=0;       
        this.lastAllText="";
        this.mycontainer;
	var parent = this;
        var socket;
	this.clickListener = function(event) {
		if (parent.core.isMarkedNode(event.target))
			parent.suggest(event.target);
	};
       
        this.keyupListener = function(event) {
            /*alert("keyup event.keyCode:"+event.keyCode+" event.ctrlKey:"+event.ctrlKey+" event.altKey:"+event.altKey+" event.metaKey:"+event.metaKey+" event.key:"+event.key+" event.data:"+event.data+" event.which:"+event.which);*/
            if(event.keyCode==8){
               parent.delCount=parent.delCount+1;
            }else if(event.keyCode==91){
               /*alert("event.keyCode is 91");*/
               if(parent.copyCount==0)
               {
                 parent.core.clearCurrentErrors();           
                 parent.delCount=parent.delCount+1;
               }
               parent.lastAllText="";
               parent.copyCount=0;
            }
            /*alert(" parent.delCount:"+parent.delCount);*/

            event.stopPropagation();
            event.stopImmediatePropagation();
            /*alert("parent.delCount:"+parent.delCount);*/
        };


        this.textInputListener = function(event){
            /*alert("key text input event.keyCode:"+event.keyCode+" event.ctrlKey:"+event.ctrlKey+" event.altKey:"+event.altKey+" event.metaKey:"+event.metaKey);*/
            parent.inputCount=parent.inputCount+1;
            /*alert("parent.inputCount:"+parent.inputCount);*/
            event.stopPropagation();
            event.stopImmediatePropagation();         
        };

        this.copyListener = function(event) {
           /*alert("copy event.keyCode:"+event.keyCode);*/
           parent.copyCount=parent.copyCount+1;
           event.stopPropagation();
           event.stopImmediatePropagation();
        };

        this.mytrim = function(str){
           return str.replace(/(^\s*)|(\s*$)/g, '');
        };
        
        this.removeRedundantBlankH = function(str){
           return str.replace(/^[\s]+/,'').replace(/[\s]+$/,'').replace(/[\s]{2,}/,' ');
        };


        this.getCurrentCheck = function(){
              var mycontainer_nodes=parent.mycontainer.contents();
              var allText="";
              var j=0;

              for(j=0;j<mycontainer_nodes.length;j++)
              {
                 if(mycontainer_nodes[j]==null||mycontainer_nodes[j].nodeValue==null)
                    continue;
                 if(j!=mycontainer_nodes.length-1)
                    allText+=parent.mytrim(mycontainer_nodes[j].nodeValue)+" ";
                 else
                    allText+=parent.mytrim(mycontainer_nodes[j].nodeValue);
              }

              allText=parent.mytrim(allText);
              var allText2="";
              parent.core._walk(mycontainer_nodes,allText, function(n) {
                /*alert("ntype:"+n.nodeType+" nval:"+n.nodeValue+" nhtml:"+n.innerHTML);*/
                if(n.nodeType==3){
                    allText2= allText2+parent.mytrim(n.nodeValue)+" ";
                }
              });

              /*alert("allText2:"+allText2);*/
              return parent.mytrim(allText2);
        };

        this.mouseleaveListener = function(event){
            if(parent.delCount>0){
              /*alert("mouse leave after "+parent.delCount+" keyup"+" target.val:"+event.target.nodeValue+" target.nhtml:"+event.target.innerHTML);*/
              parent.delCount=0;
            }else if(parent.inputCount>0){
              /*alert("text input after "+parent.inputCount+" input"+" target.val:"+event.target.nodeValue+" target.nhtml:"+event.target.innerHTML);*/
              parent.inputCount=0;
            }

        };

        this.getDifferent = function(allTextOne,allTextTwo){

              if(allTextOne==""){
                 return allTextTwo;
              }else if(allTextTwo==""){
                 return allTextTwo;
              }

              var onestrs= new Array();
              onestrs=allTextOne.split(".");
              
              var twostrs= new Array();
              twostrs=allTextTwo.split(".");   
              /*alert("onestrs.length:"+onestrs.length+" twostrs.length:"+twostrs.length);*/
              var diffentSents="";
              var oneReg="";
              var twoReg="";
              for(var i=0;i<twostrs.length;i++){
                  var inOne=false;
                  twoReg=parent.mytrim(parent.removeRedundantBlankH(twostrs[i]));
                  for(var j=0;j<onestrs.length;j++){
                     oneReg=parent.mytrim(parent.removeRedundantBlankH(onestrs[i]));
                     if(twoReg==oneReg)
                       inOne=true;
                  }
  
                 if(inOne==false){
                     diffentSents=diffentSents+(twostrs[i]+" . ");
                 }                 
              }

              
              /*alert("diffentSents:"+diffentSents+" allTextOne:"+allTextOne+" allTextTwo:"+allTextTwo);*/
              return diffentSents;

        };

        this.mouseoutListener = function(event){
            if(parent.delCount>0){
              parent.delCount=0;
              /*alert("mouse out after "+parent.delCount+" keyup"+" target.val:"+event.target.nodeValue+" target.nhtml:"+event.target.innerHTML);*/
              var allText3=parent.getCurrentCheck();
              /*alert("begin to get different keyup");*/
              var diff=parent.getDifferent(parent.lastAllText,allText3);
              /*alert("keyup diff:"+diff);*/
              parent.socket.emit('message',{
                     text: diff
              });
              parent.lastAllText=allText3;
              /*parent.delCount=0;*/
            }else if(parent.inputCount>0){
              parent.inputCount=0;
              /*alert("text input after "+parent.inputCount+" input"+" target.val:"+event.target.nodeValue+" target.nhtml:"+event.target.innerHTML);*/
              var allText3=parent.getCurrentCheck();
              /*alert("begin to get different input");*/
              var diff=parent.getDifferent(parent.lastAllText,allText3);
              /*alert("input diff:"+diff);*/
              parent.socket.emit('message',{
                     text: diff
              });
              parent.lastAllText=allText3;
              /*parent.inputCount=0;*/
            }
        };

	this.ignoreSuggestion = function(e) {
		parent.core.removeParent(parent.errorElement);

		parent.counter --;
		if (parent.counter == 0 && parent.callback_f != undefined && parent.callback_f.success != undefined)
			parent.callback_f.success(parent.count);
	};

	this.explainError = function(e) {
		if (parent.callback_f != undefined && parent.callback_f.explain != undefined)
			parent.callback_f.explain(parent.explainURL);
	};



	this.core = (function() {
		var core = new AtDCore();

		core.hasClass = function(node, className) {
			return jQuery(node).hasClass(className);
		};

		core.map = jQuery.map;

		core.contents = function(node) {
			return jQuery(node).contents();
		};

		core.replaceWith = function(old_node, new_node) {
			return jQuery(old_node).replaceWith(new_node);
		};

		core.findSpans = function(parent) {
        		return jQuery.makeArray(parent.find('span'));
		};

		/* taken from AtD/Firefox, thanks Mitcho */
		core.create = function(string) {
			// replace out all tags with &-equivalents so that we preserve tag text.
			string = string.replace(/\&/g,'&amp;');
			string = string.replace(/\</g,'&lt;').replace(/\>/g,'&gt;');

			// find all instances of AtD-created spans
			var matches = string.match(/\&lt\;span class=\"hidden\w+?\" pre="[^"]*"\&gt\;.*?\&lt\;\/span\&gt\;/g);

			// ... and fix the tags in those substrings.
			if (matches) {
				matches.forEach(function(match) {
					string = string.replace(match,match.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'));
				},this);
			}

			var node = jQuery('<span class="mceItemHidden" spellcheck="false"></span>');
			node.html(string);
			return node;
		};

		core.remove = function(node) {
			return jQuery(node).remove();
		};

		core.removeParent = function(node) {
                      // alert("remove parent in atd:"+jQuery(node).html()+" p:"+jQuery(node).parent().html());
			/* unwrap exists in jQuery 1.4+ only. Thankfully because replaceWith as-used here won't work in 1.4 */
			if (jQuery(node).unwrap)
				return jQuery(node).contents().unwrap();
			else
				return jQuery(node).replaceWith(jQuery(node).html());
		};

		core.getAttrib = function(node, name) {
			return jQuery(node).attr(name);
		};

		return core;
	})();

        /*
	this.check = function(container, source, callback_f) {
		chrome.extension.sendRequest({ command: 'options' }, function(o) {
			parent.setIgnoreStrings(o.phrases);
			parent.showTypes(o.options);
			parent._check(container, source, callback_f);
		});
	};
       */

	/* redefine the communication channel */
	this.check = function(container,div, source, callback_f) {
        	parent.callback_f = callback_f; /* remember the callback for later */
		parent.remove(container);
                //var textContent    = jQuery.trim(source).replace(/<\/?[^>]*>/g, "");
                var textContent    = jQuery.trim(source);
                /*alert("call the server check");*/
                parent.lastAllText=textContent;        
                this.socket.emit('message',{
                     text: textContent
                   }); 
                              
                /*             
                var strs= new Array(); 
                strs=textContent.split(".");
                var i;

                for (i=0;i<strs.length ;i++ ) {
                   alert("strs["+i+"]="+strs[i]);
                   this.socket.emit('message',{
                     text: strs[i]
                   });
         	}
                */
                
               
                $('#check-response').dblclick(function(){
                    var response=jQuery.trim($('#check-response').text());
                                      
                    var xml = (new DOMParser()).parseFromString(response, 'text/html');
                    /* check for and display error messages from the server */
	            if (parent.core.hasErrorMessage(xml)) {
			if (parent.callback_f != undefined && parent.callback_f.error != undefined)
				parent.callback_f.error(parent.core.getErrorMessage(xml));

			return;
		    }

		    /* highlight the errors */
		    /*parent.container = container;*/
                     var count = parent.processXML(container, xml);
                    /*alert("count:"+count);*/
		    if (parent.callback_f != undefined && parent.callback_f.ready != undefined)
			  parent.callback_f.ready(count);

		    if (count == 0 && parent.callback_f != undefined && parent.callback_f.success != undefined)
			  parent.callback_f.success(count);
                    
                    if(isNaN(parent.counter))
                    {
                         parent.counter=count;
                    }else{
                         parent.counter = parent.counter+ count;
                    }

                    if(isNaN(parent.count))
                    {
		        parent.count   = count;
                    }else{
                        parent.count   = parent.count+count;
                    }

                });                      
	
	}

}

AtD_Basic.prototype.getLang = function(key, defaultk) {
	if (this.i18n[key] == undefined)
		return defaultk;

	return this.i18n[key];
};

AtD_Basic.prototype.addI18n = function(localizations) {
	this.i18n = localizations;
	this.core.addI18n(localizations);
};

AtD_Basic.prototype.setIgnoreStrings = function(string) {
	this.core.setIgnoreStrings(string);
};

AtD_Basic.prototype.showTypes = function(string) {
	this.core.showTypes(string);
};

AtD_Basic.prototype.useSuggestion = function(word) {
        
	this.core.applySuggestion(this.errorElement, word);
        /*alert("this.counter:"+this.counter);*/	
        this.counter --;
	if (this.counter == 0 && this.callback_f != undefined && this.callback_f.success != undefined)
		this.callback_f.success(this.count);
	else
		this.sync();
        

};

AtD_Basic.prototype.remove = function(container) {
	/* destroy the menu when we remove the HTML */
	if (this.lastSuggest)
        {
		this.lastSuggest.remove();
        }
	this.lastSuggest = undefined;

	this._removeWords(container, null);
};


AtD_Basic.prototype.processXML = function(container, responseXML) {
        this.mycontainer=container;
        var allTextM=this.getCurrentCheck(); 
        /*parent.lastAllText=allTextM;*/ 
	var results = this.core.processXML(responseXML,allTextM);
	if (results.count > 0)
		results.count = this.core.markMyWords(container.contents(), results.errors);

        this.mycontainer=container;
        container.unbind('click', this.clickListener);
	container.click(this.clickListener);
        container.bind('textInput',this.textInputListener); 
        container.bind('keyup',this.keyupListener);
        container.bind('copy',this.copyListener);
        /*container.bind('mouseleave',this.mouseleaveListener);*/        
        container.bind('mouseout',this.mouseoutListener);
	return results.count;
};

AtD_Basic.prototype.editSelection = function() {
	var parent = this.errorElement.parent();

	if (this.callback_f != undefined && this.callback_f.editSelection != undefined)
		this.callback_f.editSelection(this.errorElement);

	if (this.errorElement.parent() != parent) {
		this.counter --;
		if (this.counter == 0 && this.callback_f != undefined && this.callback_f.success != undefined)
			this.callback_f.success(this.count);
	}
};

AtD_Basic.prototype.ignoreAll = function(container) {
	var target = this.errorElement.text();
	var removed = this._removeWords(container, target);

	this.counter -= removed;

	if (this.counter == 0 && this.callback_f != undefined && this.callback_f.success != undefined)
		this.callback_f.success(this.count);

	if (this.callback_f != undefined && this.callback_f.ignore != undefined) {
		this.callback_f.ignore(target);
		this.core.setIgnoreStrings(target);
	}
};

AtD_Basic.prototype.suggest = function(element) {
	var parent = this;
        /*alert("in jquery.atd.suggest");*/
	/* construct the menu if it doesn't already exist */

	var suggest = jQuery('<div class="suggestmenu"></div>');
	suggest.prependTo('body');

	/* make sure there is only one menu at a time */

	if (parent.lastSuggest)
		parent.lastSuggest.remove();

	parent.lastSuggest = suggest;

	/* find the correct suggestions object */

	errorDescription = this.core.findSuggestion(element);

	/* build up the menu y0 */

	this.errorElement = jQuery(element);

	suggest.empty();

	if (errorDescription == undefined) {
		suggest.append('<strong>' + this.getLang('menu_title_no_suggestions', 'No suggestions') + '</strong>');
	}
	else if (errorDescription["suggestions"].length == 0) {
		suggest.append('<strong>' + errorDescription['description'] + '</strong>');
	}
	else {
		suggest.append('<strong>' + errorDescription['description'] + '</strong>');

		var parent = this;
		for (var i = 0; i < errorDescription["suggestions"].length; i++) {
			(function(sugg) {
				var node = jQuery('<div>' + sugg + '</div>');
				node.click(function(e) {
					parent.useSuggestion(sugg);
					suggest.remove();
					e.preventDefault();
					e.stopPropagation();
				});
				suggest.append(node);
			})(errorDescription["suggestions"][i]);
		}
	}

	/* do the explain menu if configured */

	if (this.callback_f != undefined && this.callback_f.explain != undefined && errorDescription['moreinfo'] != undefined) {
		var node = jQuery('<div class="spell_sep_top">' + this.getLang('menu_option_explain', 'Explain...') + '</div>');
		node.click(function(e) {
			parent.explainError();
			suggest.remove();
			e.preventDefault();
			e.stopPropagation();
		});
		suggest.append(node);
		this.explainURL = errorDescription['moreinfo'];
	}

	/* do the ignore option */

	var node = jQuery('<div class="spell_sep_top">' + this.getLang('menu_option_ignore_once', 'Ignore suggestion') + '</div>');
	node.click(function(e) {
		parent.ignoreSuggestion();
		suggest.remove();
		e.preventDefault();
		e.stopPropagation();
	});
	suggest.append(node);

	/* add the edit in place and ignore always option */

	if (this.callback_f != undefined && this.callback_f.editSelection != undefined) {

		if (this.callback_f != undefined && this.callback_f.ignore != undefined)
			node = jQuery('<div>' + this.getLang('menu_option_ignore_always', 'Ignore always') + '</div>');
		else
			node = jQuery('<div>' + this.getLang('menu_option_ignore_all', 'Ignore all') + '</div>');

		suggest.append(node);

		var node2 = jQuery('<div class="spell_sep_bottom spell_sep_top">' + this.getLang('menu_option_edit_selection', 'Edit Selection...') + '</div>');
		node2.click(function(e) {
			parent.editSelection(parent.container);
			suggest.remove();
			e.preventDefault();
			e.stopPropagation();
		});
		suggest.append(node2);
	}
	else {
		if (this.callback_f != undefined && this.callback_f.ignore != undefined)
			node = jQuery('<div class="spell_sep_bottom">' + this.getLang('menu_option_ignore_always', 'Ignore always') + '</div>');
		else
			node = jQuery('<div class="spell_sep_bottom">' + this.getLang('menu_option_ignore_all', 'Ignore all') + '</div>');
		suggest.append(node);
	}

	node.click(function(e) {
		parent.ignoreAll(parent.container);
		suggest.remove();
		e.preventDefault();
		e.stopPropagation();
	});

	/* show the menu */

	var pos = jQuery(element).offset();
	var width = jQuery(element).width();
	jQuery(suggest).css({ left: (pos.left + width) + 'px', top: pos.top + 'px' });

	jQuery(suggest).show();

	/* bind events to make the menu disappear when the user clicks outside of it */
	this.suggestShow = true;
	setTimeout(function() {
		jQuery("body").bind("click", function() {
			if (!parent.suggestShow)
				suggest.remove();
		});
	}, 1);

	setTimeout(function() {
		parent.suggestShow = false;
	}, 10);
};

AtD_Basic.prototype._removeWords = function(container, w) {
	return this.core.removeWords(container, w);
};
