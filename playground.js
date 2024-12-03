class myTest {
    name = '111';
    msg;
    constructor(msg) {
        this.msg = msg;
        this.msg.add(() => this.sayHello());
    }
    sayHello() {
        console.log(`hello ${this.name}`);
    }
}

class mytesta {
    list = {};

    constructor() {
    }

    greet() {
        this.list.fun();
    }

    add(greetMethod) {
        this.list.fun = greetMethod;
    }
}

const b = new mytesta();
const a = new myTest(b);

b.greet(); // hello kimi