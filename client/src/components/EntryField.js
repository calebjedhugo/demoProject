import React, { Component } from 'react';

//This used to get used for everything, but now it only handles the date filters.
//It's a handy little component, through.
export class EntryField extends Component{
  constructor(props){
    super(props);
    this.state = {
      pendingValue: this.props.value,
      editing: false
    }
  }

  get editableInput(){
    return (<input
      className={'editableInput'}
      maxLength={this.props.maxLength}
      autoComplete={'off'}
      value={this.state.pendingValue}
      onChange={e => {this.setState({pendingValue: e.target.value})}}
      autoFocus={true}
      onFocus={
        e => {
          e.target.select()/*Seems like a bug in react makes this not work for iPhones?*/;
          clearTimeout(this.out)
        }} size={this.props.maxLength}
       type={this.props.type || 'text'}
       max={this.props.max}
       min={this.props.min}
      ></input>)
  }

  render(){
    return (
      <div className={`entryCell${this.props.className ? ` ${this.props.className}` : ''}`}
        id={this.props.id}
        onBlur={e => {
          //The timeout gives children the chance to cancel the closing of the box.
          //I couldn't figure out how to make this work in Firefox with a 0ms timeout. It is what it is. :/
          this.out = setTimeout(() => this.setState({editing: false}), 500);
        }}>
        {this.state.editing ?
          <form onSubmit={e => {
            e.preventDefault();
            this.props.submit(this.state.pendingValue);
            this.setState({editing: false});
          }}>
            {this.editableInput}
            <div>
              <input
                className={'editableInputSubmit'}
                type='submit' value='Submit'
                disabled={this.state.pendingValue === this.props.value}
                onFocus={() => clearTimeout(this.out)}>
              </input>
              <input type='button' value='Cancel' onClick={() => this.setState({editing: false})}></input>
            </div>
          </form> : <div onClick={() => this.setState({editing: true})}>{this.props.value}</div>
        }
      </div>)
  }
}
