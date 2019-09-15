import React, { Component } from 'react';
import {Loader} from './Loader.js'
import axios from 'axios';

export class ParChanger extends Component {
  constructor(props){
    super(props);
    this.state = {
      editing: false,
      pendingParCalories: this.props.parCalories,
      error: '',
      loading: false
    }
    this.changePar = this.changePar.bind(this);
  }

  componentDidUpdate(prevProps){
    if(this.props.parCalories !== prevProps.parCalories){
      //So if we change parCalories, we're not seeing the value from the last person when we click.
      this.setState({pendingParCalories: this.props.parCalories})
    }
  }

  changePar(){
    this.setState({loading: true})
    axios({
      url: `users`,
      method: 'PATCH',
      data: {
        parCalories: this.state.pendingParCalories,
        _id: this.props.selectedId
      }
    }).then(res => {
      var data = res.data;
      this.props.setPar(data.parCalories);
      this.setState({editing: false, error: '', pendingParCalories: data.parCalories});
    }).catch(e => {
      this.setState({error: e.response ? e.response.data : e.message})
    }).finally(() => this.setState({loading: false}))
  }

  render(){
    return (
      <div id='parChanger' onClick={() => this.setState({editing: true})} onBlur={() => {
        //The timeout gives children the chance to cancel the closing of the box.
        //It's not clean, but I'm attached to the idea. Setting the timeout to 0 breaks firefox. :/
        this.out = setTimeout(() => this.setState({editing: false, error: ''}), 500);
      }}>
        <div className='label'>{'Daily Calorie Limit:'}</div>
        {this.state.editing ?
          <React.Fragment>
            <form onSubmit={e => {
              e.preventDefault();
              this.changePar();
            }}>
              <div>
                <input id='parChangerInput' type='number' value={this.state.pendingParCalories} autoFocus className='input'
                  onChange={
                    e => this.setState({pendingParCalories: e.target.value})
                  }
                  onFocus={e => {
                    e.target.select()
                    clearTimeout(this.out); //don't close it, we're still here!
                  }}
                ></input>
              </div>
              <div>{Number(this.state.pendingParCalories) !== Number(this.props.parCalories) ?
                <input type='submit'
                  onFocus={() => {clearTimeout(this.out)}}
                  id={'parChangerConfirm'}
                  value={this.state.pendingParCalories < this.props.parCalories ?
                    'Submit to eating less' :
                    'Confirm to eat more'}>
                </input> : null}{this.state.loading ? <Loader /> : null}</div>
            </form>
          </React.Fragment> :
          <div id='parChangerDisplay' className='value'>{this.props.parCalories}</div>}
        {this.props.parCalories === 2000 && !this.state.editing ? <div className='label'>{'Click to edit'}</div> : null}
        {this.state.error ? <div className={'errorMessage'}>{this.state.error}</div> : null}
      </div>
    )
  }
}
