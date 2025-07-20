function hello(a,b){
    this.a=b;
    console.log(this.a);
}

hello(1,2);