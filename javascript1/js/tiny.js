/**
 * Created by Tiny Lu on 2018/08/09.
 * 极简双向绑定实现
 */
//根据属性ID 找到数组中的对应对象的数组
Array.prototype.getbyfield = function(field,value)
{
    var _this = this;
    var rlist =[];
    for(var i =0;i<_this.length;i++)
    {
        if(_this[i][field] == value)
        {
            rlist.push(_this[i]);
        }
    }
    return rlist;
};
//监听对象的get,set函数，并且
var defineProperty = function(obj,key,val,publisher)
{
    Object.defineProperty(obj,key,{
        get: function () {
            return val;
        },
        set: function (newVal) {
            if(val == newVal) return;
            val = newVal;
            publisher.publish(); //当值发生变化时去做出这个通知
        }
    });
};
var observe = function(obj)//循环监听一个对象中的所有的属性值
{
    var psherList = [];
    Object.keys(obj).forEach(function(key) //Object.keys（）方法了解一下？
    {
        var psher = new publisher(key); //一个字段对应一个publisher
        psherList.push(psher);
        defineProperty(obj,key,obj[key],psher);
    });
    return psherList;
};
//在观察者模式中，必然有发布者和订阅者，publisher为发布者
var publisher = function(key)
{
    this.key = key;
    this.watchers = [];//订阅该发布者的订阅者
    return this;
};
publisher.prototype = {
    addWatcher:function(param){ //增加订阅者
        this.watchers.push(param);
    },
    removeWatcher:function(param){ //删除订阅者

    },
    publish:function()
    {
        this.watchers.forEach(function (watcher) {
            watcher.update();
        });
    }
};
//在观察者模式中，必然有发布者和订阅者，watcher为订阅者
var watcher = function(node,vm,key)
{
    this.node = node;
    this.vm = vm;
    this.key = key;
    return this;
};
watcher.prototype = {
    update:function()
    {
        if(this.node.nodeType === 1)
        {
            this.node.value = this.vm.data[this.key];
        }
        if(this.node.nodeType === 3)
        {
            this.node.nodeValue = this.vm.data[this.key];
        }
    }
};
//编译节点
var compile = function(node,vm,publisherList)
{
    var reg = /\{\{(.*)\}\}/;
    if(node.nodeType === 1) //节点类型为元素
    {
        var attr = node.attributes;
        for(var i= 0;i< attr.length;i++)
        {
            if(attr[i].nodeName == "t-model")
            {
                var name = attr[i].nodeValue;
                node.addEventListener("input",function (e) {
                    vm.data[name] = e.target.value;
                });
                node.value = vm.data[name];
                node.removeAttribute("t-model");
                var psher = publisherList.getbyfield("key",name);
                var mywatcher = new watcher(node,vm,name);//出现了一个问题啊，如果我这么写 var watcher = new watcher(node,vm)会报 watcher is not a constructor。名字不能和构造器函数一样？
                psher[0].addWatcher(mywatcher);
            }
        }
    }
    if(node.nodeType === 3)//节点类型为text
    {
        if(reg.test(node.nodeValue))
        {
            var name = RegExp.$1;
            name = name.trim();
            node.nodeValue = vm.data[name];
            var psher = publisherList.getbyfield("key",name);
            var mywatcher = new watcher(node,vm,name);//出现了一个问题啊，如果我这么写 var watcher = new watcher(node,vm)会报 watcher is not a constructor。名字不能和构造器函数一样？
            psher[0].addWatcher(mywatcher);
        }
    }
};
//劫持节点
var nodeFragment = function(id,vm,publisherList)
{
    var frag = document.createDocumentFragment(); // documentFragment 对象可以劫持 DOM结构。加入documentFragment的Node将自动从DOM中删除
    var app = document.getElementById(id);
    var child;
    while (child = app.firstChild)
    {
        compile(child,vm,publisherList);
        frag.appendChild(child);
    }
    return frag;
};
//初始化
var tiny = function(param)
{
    this.data = param.data;
    var plisherList = observe(this.data);
    var id = param.ele;
    var dom = nodeFragment(id,this,plisherList);
    document.getElementById(id).appendChild(dom);
};