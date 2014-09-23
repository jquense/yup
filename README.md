Clank
========

A simple prototypal inheritance abstraction with an emphasis on composition. Clank is a _thin_ wrapper around [cobble](https://github.com/theporchrat/cobble/). If you used Backbone or Ember this API should feel familiar, there is no magic here, just a few wrappers around the normal prototypal inheritance you are used to.

It is _highly_ recommended that you take a look at the [tests (`./test/class.js`)](https://github.com/theporchrat/clank/blob/master/test/class.js) for a far more extensive demostration of the functionality of Clank.

## Browser Support

Works fine in IE8 but does expect certain es5 functions, include es5 shim and sham in IE8 and everything will work fine, with a single caveat: object constructors are assigned a non-enumerable property `__META__`, which in IE8 _is_ enumerable, so keep that in mind, when using `Object.assign` and other "extend" functions.

## API

require the module; 

    var Clank = require('clank')

The Clank object [is just the cobble function](https://github.com/theporchrat/cobble/#cobbleobjects) with a single new property `.Object` which is your base object.

## Clank.Object

### .extend(...spec)

Every Constructor returned from `.extend()` also has an extend method.

    var Human = Clank.Object.extend({ species: 'Homo Sapien' })
    var Jimmy = Human.extend({ name: Jimmy })

    new Jimmy

You can also pass in multiple spec objects and make use of Clanks, underlying use of cobble. 

    var Person = Clank.Object.extend({ species: 'homo sapian', limbs: 4 })
      , docOctMixin = { limbs: 8 }
      , DocOct = Person.extend(docOct, { gender: 'male' });

    var doc = new DocOct()
    doc.limbs // => 8

This effectively means taht you can specify mixin objects before your prototype spec.

You can also use cobble's descriptors to handle overrides and super calls. __See the cobble documentation for more information on descriptors__

    var EnglishSpeaker  = Clank.Object.extend({ greet: function(){ return "hello" } })

    var spanishGreeting = { greet: function(){ return "hola" } }
    var germanGreeting  = { greet: function(){ return "guten morgen" } }

    var GermanSpanishAmerican = EnglishSpeaker.extend(spanishGreeting, germanGreeting, { 
          greet: Clank.reduce(function (target, next) {
            return function(){
              return target.call(this) + " and " + next.call(this)
            }
          }) 
        });

    var person = new GermanSpanishAmerican()

    person.greet() // => "hello and hola and guten morgen"
    
    
    // Super calls with Constructors
    // ---------
    
    var Machine = Clank.Object.extend({
           
           constructor: function(){
             Clank.Object.call(this) //call the super constructor in the traditional way
             
             this.greeting = (this.greeting || '') + 'whizz'
           }
         })
     
    var Toaster = Machine.extend({ 
    
          // call the super Toaster constructor after the Toaster constructor using a Descriptor
          constructor: Clank.before(function(){
            this.greeting = 'whorl'
          })
        })


### .reopen(...spec)

`.reopen` is like `.extend` but instead of creating a new Class it alters the current class prototype. Changes made to the prototype will cascade throguh the object heirarchy. 

`.reopen` has the same signature as `.extend`.

    var Person = Clank.Object.extend({ species: 'homo sapien'})
      , Man    = Person.extend({ gender: 'male' });

    var man = new Man()

    man.gender // => 'male'
    man.limbs  // => undefined
    
    Man.reopen({
      limbs: 4,
      gender: 'irrelevant'
    })

    man.gender // => 'irrelevant'
    man.limbs  // => 4


### .create(...properties)

Returns an instance of the object with instance properties set to the passed in object, or array of objects. `.create` also has the same signature as `.extend()` so you can use descriptors as well to compose properties.

    var Person = Clank.Object.extend({ greeting: 'guten tag' }); 

    var me  = Person.create({ greeting: 'hello'})
      , friend = Person.create()

    me.hasOwnProperty('greeting')     // => true
    me.greeting                       // => 'hello'

    friend.hasOwnProperty('greeting') // => false
    friend.greeting                   // => 'guten tag'

### Default Object Composition

In certain cases you may want to create an object Class with a default composition behaviour when extending or creating instances. Clank provides the `Constructor.setCompositionStrategy(spec)` method for doing just this. The provided `spec` should be an object of `Descriptors` that will be mixed into the instance or extension after all user provided compositions.

    var Person = Clank.Object.extend({ traits: [ 'biped', 'hair'] });

    // in the future traits will be concated together
    Person.setCompositionStrategy({
      traits: Clank.concat()
    })

    var Hero  = Person.extend({ traits: [ 'brave' ] }) //no need to manually resolve this conflict
    
    var  jimmy = new Hero;

    jimmy.traits // => [ 'biped', 'hair', 'brave' ]

This can be very helpful for creating some default behaviour in an often used object, but beware, a user can still provide their own compositions, that run _before_ the default strategy. If the user is unaware of the default strategy this can introduce subtle bugs when they try and duplicate a behaviour.

## Super Calls

By default the descriptors, such as `before()` and `after()`, include super methods and properties, so they are composed together along with any mixins.

    var Person = Clank.Object.extend({ 
          greet: function(name){
            return "hello"  + " " + name
          }
        }) 

    var Pirate = Person.extend({ 
          greet: Clank.compose(function(greeting){
            return  "ARRRRRRG and " + greeting 
          })
        })

    var blackBeard = new Pirate()

    blackBeard.greet('Steven') // => "ARRRRRRG and hello Steven"


Clank _does_ have a "proper" `super` implementation but you probably don't need it. The majority of super use-cases, can be solved by simple doing `Parent.prototype[method].call(this, [args]` or by using a Descriptor. Overuse of the super keyword can lead to bad patterns (like calling `_super` in a mixin object), and should be saved for situations when you cannot use a static reference, or you know the super method may change.

For a bunch of reasons, using `_super` is going to be less performant than a static reference (either method). __Note: super also makes use of `Function.caller`, a depreciated js feature, internally.__

In a few cases where you need to dynamically reference the super class, super han be accessed by `this._super([method]) => returns the method` inside a class method, however, there are a bunch of pitfalls and caveats related to its use, which is why it is __underscored__. Consult the tests for insight into the limitations of this method.
