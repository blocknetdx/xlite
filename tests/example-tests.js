/* global describe, it */
require('should');

class Person {

  constructor(name, age) {
    this._name = name;
    this._age = age;
  }

  getName() {
    return this._name;
  }

  getAge() {
    return this._age;
  }

}

describe('Person', function() {

  const name = 'Ross Ulbricht';
  const age = 36;
  const person = new Person(name, age);

  it('should be a constructor', function() {
    Person.should.be.a.Function();
    person.should.be.an.instanceOf(Person);
  });

  describe('A person instance', function() {

    it('should have a getName method', function() {
      person.getName.should.be.a.Function();
    });

    describe('the getName method', function() {

      it('should return the person\'s name', function() {
        person.getName().should.equal(name);
      });

    });

    it('should have a getAge method', function() {
      person.getAge.should.be.a.Function();
    });

    describe('the getAge method', function() {

      it('should return the person\'s age', function() {
        person.getAge().should.equal(age);
      });

    });

  });

});

