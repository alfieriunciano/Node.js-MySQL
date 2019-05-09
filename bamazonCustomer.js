var mysql = require('mysql');
var sql = {
    con: mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "password123",
        database: "bamazon_db"
    })
}

var bamazon = {
    init: function() {
        
        var inq = require('inquirer');
        this.startDb(); 
        this.displayProducts();
        this.initInq(inq); 
    },
    
    startDb: function() {
        sql.con.connect(function(err) {
            if (err) { throw err; }
            console.log("Connected to Database!");
        });
    },
    
    displayProducts: function() {
     
        var tables = require("./tables.js");
        sql.con.query("SELECT * FROM products", function(err, result, fields) {
            if (err) throw err;
            for (i = 0; i < result.length; i++) {
                var data = result[i];
                console.log(data.product_name);
                //tables.makeTable.prodList.push([data.item_id, data.product_name, data.department_name, data.price, data.stock_quantity]);
            }
            //console.log(tables.makeTable.prodList.toString() + "\n\n\n\n");
        });
    },

    initInq: function(inq) {
        inq.prompt([{
            type: "choices",
            message: "Which product would you like to purchase?? Please enter an item_id \n\n",
            name: "item"
        }]).then(function(data) {
    
            data.item = parseInt(data.item);

            if (isNaN(data.item) === false) {
                var item = data.item;
                bamazon.initQuant(inq, item); 
            }
            
            else {
                console.log("PLEASE ENTER A NUMBER");
                bamazon.initInq(inq);
            }
        });
    },
   
    initQuant: function(inq, item) {
        inq.prompt([{
            type: "input",
            message: "How many would you like to purchase?? Please enter number \n\n",
            name: "count"
        }]).then(function(data) {
  
            data.count = parseInt(data.count);
   
            if (isNaN(data.count) === false) {
                var quant = parseInt(data.count);
                bamazon.confirmOrder(inq, item, quant);
            }
       
            else {
                console.log("PLEASE ENTER A NUMBER");
                bamazon.initQuant(inq, item);
            }
        });
    },

    confirmOrder: function(inq, item, quant) {
        var query = "SELECT product_name, price, stock_quantity FROM products WHERE ?";
        sql.con.query(query, { item_id: item }, function(err, res) {
            var custCost = quant * res[0].price;
            var response = "";
            inq.prompt({
                    name: "confirmOrder",
                    type: "confirm",
                    message: "Please confirm you want to purchase " + quant + " " + res[0].product_name + " for $" + custCost
                })
                .then(function(answer) {
                    if (answer.confirmOrder === true) {
                        if (quant <= res[0].stock_quantity) {
                            response = "\n\nAwesome! We are processing your order!\n.....\n.....\n.....\n.....\n.....\n";
                            var quantNew = res[0].stock_quantity - quant;
                            var prodName = res[0].product_name;
                            //bamazon.createOrder(item, prodName, quant, custCost, quantNew);
                            bamazon.updateDB(item, quantNew);
                        } else {
                            response = "\n\nSorry, but you've requested more " + res[0].product_name + " than we have available.\n\n";
                            bamazon.stopDb();
                        }
                        console.log(response);
                    } else {
                        console.log("\n\nOkay. See ya later");
                        bamazon.stopDb();
                    }
                });
        })
    },
    createOrder: function(item, prodName, quant, custCost, quantNew) {
        sql.con.query(
            "INSERT INTO orders SET ?", {
                item_id: item,
                product_name: prodName,
                quantity: quant,
                total_price: custCost,
                remaining_stock: quantNew
            },
            function(err) {
                if (err) throw err;
                console.log("your order has been processed");
                var tables = require("./tables.js");
                sql.con.query("SELECT * FROM orders", function(err, result, fields) {
                    if (err) throw err;
                    for (i = 0; i < result.length; i++) {
                        var data = result[i];
                        tables.makeTable.orders.push([data.order_id, data.item_id, data.product_name, data.quantity, data.total_price, data.remaining_stock]);
                    }
                    console.log(tables.makeTable.orders.toString() + "\n\n\n\n");
                });
            }
        );
    },

    updateDB: function(item, quantNew) {
        sql.con.query(
            "UPDATE products SET ? WHERE ?", [
                { stock_quantity: quantNew },
                { item_id: item }
            ],
            function(err) {
                if (err) throw err;
                console.log("The database has been updated!");
                bamazon.stopDb();
            }
        )
    },

    stopDb: function() {
        sql.con.end(function(err) {
            if (err) { throw err; }
            console.log("Disconnected from database!\n\n\n\n");
        });
    }
}

bamazon.init();
