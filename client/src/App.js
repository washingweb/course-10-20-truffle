import React, { Component } from "react";
import SavingContract from "./contracts/Saving.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";

import "./App.css";

const extractContractInfo = ContractObject => {
  const { abi } = ContractObject;
  let address;
  const networks = Object.keys(SavingContract.networks);
  if (networks.length > 0) {
    address = SavingContract.networks[networks[0]].address;
  }

  return { abi, address };
};

// const toRecord = log => {
//   const dataString = new Date(
//     log.args[2].toNumber() * 1000
//   ).toLocaleDateString();
//   return {
//     id: log.id,
//     amount: web3.utils.fromWei(log.args[0]),
//     action: log.args[1],
//     time: dataString
//   };
// };

const toRecord = (log, web3) => {
  const dataString = new Date(
    log.args.time.toNumber() * 1000
  ).toLocaleDateString();
  return {
    id: log.id,
    amount: web3.utils.fromWei(log.args.amount.toString()),
    action: log.args.action,
    time: dataString
  };
};

class App extends Component {
  state = {
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    inputAmount: "1",
    inputAddress: "",
    balance: "",
    withdrawedAmount: "",
    isOwner: false,
    isValidUser: false,
    records: []
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const { web3, web3old } = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.

      const Contract = truffleContract(SavingContract);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      const contractInfo = extractContractInfo(SavingContract);
      console.log(contractInfo);

      const oldInstance = web3old.eth
        .contract(contractInfo.abi)
        .at(contractInfo.address);

      // var myEvent = oldInstance.BalanceChanged();
      // myEvent.watch((err, event) => {
      //   if (err) console.error(err);
      //   else {
      //     console.log(event);
      //   }
      // });

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance });

      const address = await instance.address;
      const balance = await web3.eth.getBalance(address);
      this.setState({ balance: web3.utils.fromWei(balance) });

      const withdrawedAmount = await instance.howMuchWithdrawed.call();
      this.setState({
        withdrawedAmount: web3.utils.fromWei(withdrawedAmount)
      });

      const owner = await instance.owner.call();
      const isOwner = owner === accounts[0];
      this.setState({ isOwner });

      const isValidUser = await instance.validUsers.call(accounts[0]);
      this.setState({ isValidUser });

      oldInstance.BalanceChanged().watch((err, result) => {
        if (err) {
          alert(err);
        } else {
          this.updateUiAccount();
        }
      });

      // watch history
      oldInstance
        .BalanceChanged({}, { fromBlock: 0, toBlock: "latest" })
        .watch((err, log) => {
          if (err) {
            alert(err);
          } else {
            console.log(log);
            const records = [...this.state.records, toRecord(log, web3)];
            this.setState({ records });
          }
        });

      oldInstance.UserChanged().watch((err, log) => {
        if (err) {
          alert(err);
        } else {
          this.updateUiAccount();
        }
      });

      // process previous events
      // instance.BalanceChanged(
      //   { fromBlock: 0, toBlock: "latest" },
      //   (err, result) => {
      //     if (err) {
      //       alert(err);
      //     } else {
      //       const records = [...this.state.records, toRecord(result)];
      //       this.setState({ records });
      //     }
      //   }
      // );

      // process new events
      // instance.BalanceChanged({}, (err, result) => {
      //   if (err) {
      //     alert(err);
      //   } else {
      //     console.log(result);
      //   }
      // });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  updateUiAccount = async () => {
    const { web3, contract, accounts } = this.state;

    const address = await contract.address;
    const balance = await web3.eth.getBalance(address);
    this.setState({ balance: web3.utils.fromWei(balance) });

    const withdrawedAmount = await contract.howMuchWithdrawed.call();
    this.setState({
      withdrawedAmount: web3.utils.fromWei(withdrawedAmount)
    });

    const isValidUser = await contract.validUsers.call(accounts[0]);
    this.setState({ isValidUser });

    const owner = await contract.owner.call();
    const isOwner = owner === accounts[0];
    this.setState({ isOwner });
  };

  handleClick = async () => {
    const { accounts, contract } = this.state;
    await contract.set(10, { from: accounts[0] });
    const response = await contract.get();

    // Update state with the result.
    this.setState({ storageValue: response.toNumber() });
  };

  deposit = async () => {
    const { web3, contract, accounts, inputAmount } = this.state;
    const amount = parseFloat(inputAmount);
    await contract.deposit({
      from: accounts[0],
      value: web3.utils.toWei(amount.toString())
    });
    console.log("tx sent");
  };

  withdraw = async () => {
    const { web3, contract, accounts, inputAmount } = this.state;
    const amount = parseFloat(inputAmount);
    await contract.withdraw(web3.utils.toWei(amount.toString()), {
      from: accounts[0]
    });
    console.log("tx sent");
  };

  addUser = async () => {
    const { contract, accounts, inputAddress } = this.state;
    await contract.addUser(inputAddress, {
      from: accounts[0]
    });
    console.log("tx sent");
  };

  removeUser = async () => {
    const { contract, accounts, inputAddress } = this.state;
    await contract.removeUser(inputAddress, { from: accounts[0] });
    console.log("tx sent");
  };

  onAmountChanged = e => {
    console.log(e.target.value);
    this.setState({ inputAmount: e.target.value });
  };

  onAddressChanged = e => {
    console.log(e.target.value);
    this.setState({ inputAddress: e.target.value });
  };

  runExample = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    await contract.set(5, { from: accounts[0] });

    // Get the value from the contract to prove it worked.
    const response = await contract.get();

    // Update state with the result.
    this.setState({ storageValue: response.toNumber() });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="container">
        <div className="column">
          <div>
            <div>余额</div>
            <div>{this.state.balance}</div>
          </div>
          <div>当月已取</div>
          <div>{this.state.withdrawedAmount}</div>
          <div>
            <div>
              <label>金额</label>
            </div>
            <div>
              <input
                type="text"
                name=""
                className="form-control"
                value={this.state.inputAmount}
                onChange={this.onAmountChanged}
              />
            </div>
            <div>
              <button className="btn btn-primary" onClick={this.deposit}>
                存
              </button>
              <button
                className={this.state.isValidUser ? "btn" : "btn hidden"}
                onClick={this.withdraw}
              >
                取
              </button>
            </div>
          </div>
          <div
            id="address-management"
            className={this.state.isOwner ? "" : "hidden"}
          >
            <div>
              <label>用户管理</label>
            </div>
            <div>
              <input
                type="text"
                name=""
                className="form-control"
                value={this.state.inputAddress}
                onChange={this.onAddressChanged}
              />
            </div>
            <button className="btn btn-primary" onClick={this.addUser}>
              添加
            </button>
            <button className="btn btn-danger" onClick={this.removeUser}>
              删除
            </button>
          </div>
        </div>
        <div className="column">
          <ul className="list-group">
            {this.state.records.map(r => {
              return (
                <li key={r.id} className="list-group-item">
                  <span className={r.action}>{r.time}</span>
                  <span>{r.amount}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );

    // <div className="App">
    //   <h1>hi~~</h1>
    //   <p>Your Truffle Box is installed and ready.</p>
    //   <h2>Smart Contract Example</h2>
    //   <p>
    //     If your contracts compiled and migrated successfully, below will show
    //     a stored value of 5 (by default).
    //   </p>
    //   <p>
    //     Try changing the value stored on <strong>line 37</strong> of App.js.
    //   </p>
    //   <div>The stored value is: {this.state.storageValue}</div>
    //   <button onClick={this.handleClick}>Click me to set 10</button>
    // </div>
  }
}

export default App;
