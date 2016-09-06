/**
 * 规定：
 * configDefault：默认配置项，需挂载到构造函数对象上
 *
 * 原型对象的属性
 *  set: 参数配置
 *  set.color: 颜色
 *  set.resize: 自适应
 *
 *  c: canvas对象
 *  cw: canvas宽度
 *  ch: canvas高度
 *  cxt: canvas 2d 绘图环境
 *  container: 包裹canvas的容器
 *  dots: {array} 通过arc绘制的粒子对象集
 *  [dot].x: 通过arc绘制的粒子的x值
 *  [dot].y: 通过arc绘制的粒子的y值
 *  paused: {boolean} 是否暂停
 *
 * 原型对象的方法
 *  init: 初始化配置或方法调用
 *  draw: 绘图函数
 */
/**
 * 注释说明：{object}里的object只表示json格式的对象，其他相应格式对象用function，null，array...
 */
(function ( factory ){
    if ( typeof module === 'object' && module.exports ) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser
        factory();
    }
}(function (){
	'use strict';
	var win = window;
    var doc = document;
	var	random = Math.random;
    var floor = Math.floor;
    var isArray = Array.isArray;
    var canvasSupport = !!doc.createElement('canvas').getContext;

	function pInt( str ){
		return parseInt( str, 10 );
	}

	function randomColor(){
		// http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
		return '#' + random().toString( 16 ).slice( -6 );
	}

    /**
     * 限制随机数的范围
     * @param max {number}
     * @param min {number}
     * @returns {number}
     */
	function limitRandom( max, min ){
		return random() * ( max - min ) + min;
	}

    /**
     * 对象的复制，跟jQuery extend方法一致
     * extend( target [, object1 ] [, objectN ] )
     * extend( [ deep ,] target, object1 [, objectN ] )
     * @returns {object}
     */
    function extend(){
        // 站在jQuery的肩膀之上
        var arg = arguments,
            target = arg[ 0 ] || {},
            deep = false,
            length = arg.length,
            i = 1,
            value, attr;

        if( typeof target === 'boolean' ){
            deep = target;
            target = arg[ 1 ] || {};
            i++;
        }

        for( ; i < length; i++ ){
            for( attr in arg[ i ] ){

                value = arg[ i ][ attr ];

                if( deep && ( isPlainObject( value ) || isArray( value ) ) ){

                    target[ attr ] =
                        extend( deep, isArray( value ) ? [] : {}, value );

                }else{
                    target[ attr ] = value;
                }

            }
        }

        return target;
    }

    /**
     * 对象的检测
     * @param obj {*} 需要检测的对象
     * @param type {string} 对象所属类型
     * @returns {boolean}
     */
    function typeChecking( obj, type ){
        return toString.call( obj ) === type;
    }

    function isFunction( obj ){
        return typeChecking( obj, '[object Function]' );
    }

    function isPlainObject( obj ){
        return typeChecking( obj, '[object Object]' );
    }

    /**
     * 检测对象是否是一个DOM元素
     * @param arg {*}
     * @returns {boolean}
     */
    function isElem( arg ){
        // document(nodeType===9)不能是element，因为它没有很多element该有的属性
        // 如用getComputedStyle获取不到它的宽高，就会报错
        // 当传入0的时候，不加!!会返回0，而不是Boolean值
        return !!(arg && arg.nodeType === 1);
    }

    /**
     * 获取对象的css属性值
     * @param elem {element}
     * @param attr {string}
     * @returns {*|string|number}
     */
    var getCssReg = /^\d+(\.\d+)?[a-z]+$/i;
    function getCss( elem, attr ){
        var val = win.getComputedStyle( elem )[ attr ];

        // 对于属性值是200px这样的形式，返回200这样的数字值
        return getCssReg.test( val ) ? pInt( val ) : val;
    }

    /**
     * 获取对象距离页面的top、left值
     * @param elem {element}
     * @returns {{left: (number), top: (number)}}
     */
    function offset( elem ){
        var left = elem.offsetLeft || 0;
        var top  = elem.offsetTop || 0;
        while ( elem = elem.offsetParent ){
            left += elem.offsetLeft;
            top += elem.offsetTop;
        }
        return {
            left: left,
            top: top
        };
    }

    function on( elem, evtName, handler ){
        elem.addEventListener( evtName, handler );
    }

    function off( elem, evtName, handler ){
        elem.removeEventListener( evtName, handler );
    }

    /**
     * 插件公共属性继承
     * @param context {this} 实例对象的上下文环境
     * @param constructor {function} 插件构造函数
     * @param selector {string|element} 装裹canvas画布的容器选择器
     * @param options {object} 用户配置选项
     * @returns {boolean} 供插件判断是否创建成功，成功继续执行相应代码，不成功则静默失败
     */
    var commonConfig = {
        // 全局透明度
        opacity: 1,
        // 默认true: 自适应窗口尺寸变化
        resize: true
    };
	function createCanvas( context, constructor, selector, options ){
        if( canvasSupport &&
            (context.container = isElem( selector ) ? selector : doc.querySelector( selector )) ){

            context.set = extend( {}, commonConfig, constructor.defaultConfig, options );
            context.c = doc.createElement( 'canvas' );
            context.cw = context.c.width = getCss( context.container, 'width' );
            context.ch = context.c.height = getCss( context.container, 'height' );
            context.cxt = context.c.getContext( '2d' );
            context.paused = false;

            context.container.innerHTML = '';
            context.container.appendChild( context.c );
            context.init();
        }
    }

    /**
     * 计算刻度值
     * @param val {number} 乘数，(0, 1)表示被乘数的倍数，0 & [1, +∞)表示具体数值
     * @param scale {number} 被乘数
     * @returns {number}
     */
    function scaleValue( val, scale ){
        return val > 0 && val < 1 ? scale * val : val;
    }

    function createColor( setColor ){
        var colorLength = isArray( setColor ) ? setColor.length : false;
        var color = function(){
            return setColor[ floor( random() * colorLength ) ];
        };
        return colorLength ? color : randomColor;
    }

	function pause( context, callback ){
        // 没有set表示实例创建失败，防止错误调用报错
		if( context.set && !context.paused ){
            isFunction( callback ) && callback.call( context );
            context.paused = true;
        }
	}

	function open( context, callback ){
		if( context.set && context.paused ){
            isFunction( callback ) && callback.call( context );
			context.paused = false;
			context.draw();
		}
	}

    function resize( context, callback ){
        if( context.set && context.set.resize ){
            // 不采用函数节流，会出现延迟的很不爽的效果
            on( win, 'resize', function(){
                var oldCW = context.cw;
                var oldCH = context.ch;

                context.cw = context.c.width = getCss( context.container, 'width' );
                context.ch = context.c.height = getCss( context.container, 'height' );

                var scaleX = context.cw / oldCW;
                var scaleY = context.ch / oldCH;

                context.dots.forEach(function( v ){
                    v.x *= scaleX;
                    v.y *= scaleY;
                });

                isFunction( callback ) && callback.call( context, scaleX, scaleY );

                context.paused && context.draw();
            });
        }
    }

    // requestAnimationFrame兼容处理
	win.requestAnimationFrame = (function( win ) {
		return	win.requestAnimationFrame ||
				win.webkitRequestAnimationFrame ||
				win.mozRequestAnimationFrame ||
				function( fn ) {
		        	win.setTimeout( fn, 1000 / 60 );
		        };
	})( win );

    var Particleground = {
        version: '1.0.0',
        canvasSupport: canvasSupport,
        util: {
            pInt: pInt,
            randomColor: randomColor,
            limitRandom: limitRandom,
            extend: extend,
            typeChecking: typeChecking,
            isFunction: isFunction,
            isPlainObject: isPlainObject,
            isElem: isElem,
            getCss: getCss,
            offset: offset,
            createCanvas: createCanvas,
            scaleValue: scaleValue,
            createColor: createColor,
            pause: pause,
            open: open,
            resize: resize
        },
        inherit: {
            color: function(){
                this.color = createColor( this.set.color );
                return this.color();
            },
            requestAnimationFrame: function(){
                !this.paused && win.requestAnimationFrame( this.draw.bind( this ) );
            },
            pause: function(){
                pause( this );
            },
            open: function(){
                open( this );
            },
            resize: function(){
                resize( this );
            }
        },
        event: {
            on: on,
            off: off
        },
        extend: function( prototype ){
            extend( prototype, this.inherit );
            //obj.color();
        }
    };

    // AMD. Register as an anonymous module.
    // AMD 加载方式放在头部，factory函数会比后面的插件延迟执行
    // 导致后面的插件找不到Particleground对象，报错
    if ( typeof define === 'function' && define.amd ) {
        define( function() {
            return Particleground;
        } );
    }

    win.Particleground = Particleground;
	return Particleground;
}));