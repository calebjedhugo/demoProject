import React, { Component } from 'react';
import {Loader} from './Loader.js'

//handles searches for both MealsList and UserList.
//Those components pass in instructions for properly alter their states.
export class Search extends Component {
  constructor(props){
    super(props);
    this.state = {search: '', max: this.props.max}
  }

  render(){
    return (
      <div className="search-container">
        <form onSubmit={e => {
            e.preventDefault();
            if(this.props.setSearch) this.props.setSearch(this.state.search);
            this.props.setMax(this.state.max || 10)
          }}>
          {this.props.setSearch ? <input className={'searchInput'} onChange={e => this.setState({search: e.target.value})}
          type="text" value={this.state.search} placeholder="Search..." id="nameSearch"></input> : null}
          <button type="submit" className="fa fa-search"></button>
          <input className={'maxDisplayInput'} type={'number'} min={1} max={100} value={this.state.max} onChange={e => {this.setState({max: e.target.value})}}></input>
          <button className="fa fa-arrow-left backward"
            onClick={() => this.props.setSkip(Number(this.props.skip) - Number(this.props.max))}
            disabled={this.props.skip === 0}></button>
          <button className="fa fa-arrow-right forward"
            onClick={() => this.props.setSkip(Number(this.props.skip) + Number(this.props.max))}
            disabled={this.props.skip + this.props.max >= this.props.count}></button>
          {this.props.loading ? <Loader /> : null}
        </form>
      </div>
    )
  }
}
