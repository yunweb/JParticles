
                +function () {
                    // Compatible with old browsers, such as IE8.
                    // Prevent them from throwing an error.
                    if (!document.createElement('canvas').getContext) {
                        window.JParticles.wave = function(){};
                        window.JParticles.wave.prototype.open = function(){};
window.JParticles.wave.prototype.pause = function(){};
window.JParticles.wave.prototype.setOptions = function(){};
                        return;
                    }
                    'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _JParticles = JParticles,
    utils = _JParticles.utils,
    Base = _JParticles.Base;
var random = Math.random,
    abs = Math.abs,
    PI = Math.PI,
    sin = Math.sin;

var twicePI = PI * 2;
var UNDEFINED = 'undefined';
var pInt = utils.pInt,
    limitRandom = utils.limitRandom,
    calcSpeed = utils.calcSpeed,
    _scaleValue = utils.scaleValue,
    randomColor = utils.randomColor,
    isArray = utils.isArray,
    isPlainObject = utils.isPlainObject,
    defineReadOnlyProperty = utils.defineReadOnlyProperty;

var Wave = function (_Base) {
    _inherits(Wave, _Base);

    _createClass(Wave, [{
        key: 'version',
        get: function get() {
            return '3.0.0';
        }
    }]);

    function Wave(selector, options) {
        _classCallCheck(this, Wave);

        return _possibleConstructorReturn(this, (Wave.__proto__ || Object.getPrototypeOf(Wave)).call(this, Wave, selector, options));
    }

    _createClass(Wave, [{
        key: 'init',
        value: function init() {
            if (this.set.num > 0) {

                // 线条波长，每个周期(2π)在canvas上的实际长度
                this.rippleLength = [];

                this.attrNormalize();
                this.createDots();
                this.draw();
            }
        }
    }, {
        key: 'attrNormalize',
        value: function attrNormalize() {
            var _this2 = this;

            ['fill', 'fillColor', 'line', 'lineColor', 'lineWidth', 'offsetLeft', 'offsetTop', 'crestHeight', 'rippleNum', 'speed'].forEach(function (attr) {
                return _this2.attrProcessor(attr);
            });
        }
    }, {
        key: 'attrProcessor',
        value: function attrProcessor(attr) {
            var num = this.set.num;
            var attrValue = this.set[attr];
            var stdValue = attrValue;
            var scale = attr === 'offsetLeft' ? this.cw : this.ch;

            if (!isArray(attrValue)) {
                stdValue = this.set[attr] = [];
            }

            // 将数组、字符串、数字、布尔类型属性标准化，例如 num = 3：
            // crestHeight: []或[2]或[2, 2], 标准化成: [2, 2, 2]
            // crestHeight: 2, 标准化成: [2, 2, 2]
            // 注意：(0, 1)表示容器高度的倍数，[1, +∞)表示具体数值，其他属性同理
            // scaleValue 用于处理属性值为 (0, 1) 或 [1, +∞) 这样的情况，返回计算好的数值。
            while (num--) {
                var val = isArray(attrValue) ? attrValue[num] : attrValue;

                stdValue[num] = (typeof val === 'undefined' ? 'undefined' : _typeof(val)) === UNDEFINED ? this.generateDefaultValue(attr) : this.scaleValue(attr, val, scale);

                if (attr === 'rippleNum') {
                    this.rippleLength[num] = this.cw / stdValue[num];
                }
            }
        }

        // 以下为缺省情况，属性对应的默认值

    }, {
        key: 'generateDefaultValue',
        value: function generateDefaultValue(attr) {
            var cw = this.cw,
                ch = this.ch;


            switch (attr) {
                case 'lineColor':
                case 'fillColor':
                    attr = randomColor();
                    break;
                case 'lineWidth':
                    attr = limitRandom(2, .2);
                    break;
                case 'offsetLeft':
                    attr = random() * cw;
                    break;
                case 'offsetTop':
                case 'crestHeight':
                    attr = random() * ch;
                    break;
                case 'rippleNum':
                    attr = limitRandom(cw / 2, 1);
                    break;
                case 'speed':
                    attr = limitRandom(.4, .1);
                    break;
                case 'fill':
                    attr = false;
                    break;
                case 'line':
                    attr = true;
                    break;
            }
            return attr;
        }
    }, {
        key: 'scaleValue',
        value: function scaleValue(attr, value, scale) {
            if (attr === 'offsetTop' || attr === 'offsetLeft' || attr === 'crestHeight') {
                return _scaleValue(value, scale);
            }
            return value;
        }
    }, {
        key: 'dynamicProcessor',
        value: function dynamicProcessor(name, newValue) {
            var _this3 = this;

            var scale = name === 'offsetLeft' ? this.cw : this.ch;
            var isArrayType = isArray(newValue);

            this.set[name].forEach(function (curValue, i, array) {

                var value = isArrayType ? newValue[i] : newValue;
                value = _this3.scaleValue(name, value, scale);

                // 未定义部分保持原有值
                if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === UNDEFINED) {
                    value = curValue;
                }

                array[i] = value;
            });
        }
    }, {
        key: 'setOptions',
        value: function setOptions(newOptions) {
            if (this.set.num > 0 && isPlainObject(newOptions)) {
                for (var name in newOptions) {

                    // 不允许 opacity 为 0
                    if (name === 'opacity' && newOptions[name]) {
                        this.set.opacity = newOptions[name];
                    } else if (this.dynamicOptions.indexOf(name) !== -1) {
                        this.dynamicProcessor(name, newOptions[name]);
                    }
                }
            }
        }
    }, {
        key: 'createDots',
        value: function createDots() {
            var cw = this.cw,
                rippleLength = this.rippleLength;
            var num = this.set.num;

            var dots = this.dots = [];

            while (num--) {
                var line = dots[num] = [];

                // 点的y轴步进
                var step = twicePI / rippleLength[num];

                // 创建一条线段所需的点
                for (var i = 0; i <= cw; i++) {
                    line.push({
                        x: i,
                        y: i * step
                    });
                }
            }
        }
    }, {
        key: 'draw',
        value: function draw() {
            var cxt = this.cxt,
                cw = this.cw,
                ch = this.ch,
                paused = this.paused,
                set = this.set;
            var num = set.num,
                opacity = set.opacity;


            if (num <= 0) return;

            cxt.clearRect(0, 0, cw, ch);
            cxt.globalAlpha = opacity;

            this.dots.forEach(function (line, i) {
                var crestHeight = set.crestHeight[i];
                var offsetLeft = set.offsetLeft[i];
                var offsetTop = set.offsetTop[i];
                var speed = set.speed[i];

                cxt.save();
                cxt.beginPath();

                line.forEach(function (dot, j) {
                    cxt[j ? 'lineTo' : 'moveTo'](dot.x,

                    // y = A sin ( ωx + φ ) + h
                    crestHeight * sin(dot.y + offsetLeft) + offsetTop);
                    !paused && (dot.y -= speed);
                });

                if (set.fill[i]) {
                    cxt.lineTo(cw, ch);
                    cxt.lineTo(0, ch);
                    cxt.closePath();
                    cxt.fillStyle = set.fillColor[i];
                    cxt.fill();
                }

                if (set.line[i]) {
                    cxt.lineWidth = set.lineWidth[i];
                    cxt.strokeStyle = set.lineColor[i];
                    cxt.stroke();
                }

                cxt.restore();
            });

            this.requestAnimationFrame();
        }
    }, {
        key: 'resize',
        value: function resize() {
            var _this4 = this;

            utils.resize(this, function (scaleX, scaleY) {
                if (_this4.set.num > 0) {
                    _this4.dots.forEach(function (line) {
                        line.forEach(function (dot) {
                            dot.x *= scaleX;
                            dot.y *= scaleY;
                        });
                    });
                }
            });
        }
    }]);

    return Wave;
}(Base);

// 仅允许 opacity 和以下选项动态设置


Wave.defaultConfig = {

    // 线条个数
    num: 3,

    // 是否填充背景色，设置为false相关值无效
    fill: false,

    // 填充的背景色，当fill设置为true时生效
    fillColor: [],

    // 是否绘制边框，设置为false相关值无效
    line: true,

    // 边框颜色，当stroke设置为true时生效，下同
    lineColor: [],

    // 边框宽度
    lineWidth: [],

    // 线条横向偏移值，距离canvas画布左边的偏移值
    // (0, 1)表示容器宽度的倍数，0 & [1, +∞)表示具体数值
    offsetLeft: [],

    // 线条纵向偏移值，线条中点到canvas画布顶部的距离
    // (0, 1)表示容器高度的倍数，0 & [1, +∞)表示具体数值
    offsetTop: [],

    // 波峰高度，(0, 1)表示容器高度的倍数，0 & [1, +∞)表示具体数值
    crestHeight: [],

    // 波纹个数，即正弦周期个数
    rippleNum: [],

    // 运动速度
    speed: []
};
Wave.prototype.dynamicOptions = ['fill', 'fillColor', 'line', 'lineColor', 'lineWidth', 'offsetLeft', 'offsetTop', 'crestHeight', 'speed'];

defineReadOnlyProperty(Wave, 'wave');
                }();
            
//# sourceMappingURL=maps/wave.js.map
