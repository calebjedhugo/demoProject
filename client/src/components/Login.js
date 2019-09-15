import React, { Component } from 'react';
import {Loader} from './Loader.js'
import axios from 'axios';
import {storeJwt} from '../storage.js';

//Also handles adding and editing users from admin and manager roles.
export class Login extends Component {
  constructor(props){
    super(props);
    this.login = this.login.bind(this);
    this.adminManagerEntry = Boolean(this.props.roleOptions)
    this.state = {
      email: this.props.email || '',
      password: '',
      error: '',
      name: this.props.name || '',
      confirmPassword: '',
      newUser: this.adminManagerEntry, //more fields when true.
      role: this.props.role || '',
      deleting: false,
      loading: false
    }
  }

  register(){
    this.setState({loading: true})
    if(this.props.updating){
      return this.props.updateUser({ //handled by UserEntry
        name: this.state.name,
        email: this.state.email,
        role: this.state.role
      }, this.props.closeModal())
    }
    axios({
      url: `auth/register`,
      method: 'POST',
      data: {
        name: this.state.name,
        email: this.state.email,
        password: this.state.password,
        role: this.state.role //Send empty if first logging in to avoid authentication.
      }
    }).then(async res => {
      var data = res.data
      if(data === 'success!'){
        if(this.adminManagerEntry){
          this.props.getUserData(); //A different function will have been passed in.
          this.props.closeModal();
        }
        else this.login();
      }
    }).catch(e => {
      this.setState({error: e.response ? e.response.data : e.message})
    }).finally(() => {this.setState({loading: false})})
  }

  login(){
    this.setState({loading: true})
    axios({
      url: `auth/login`,
      method: 'GET',
      params: {
        email: this.state.email,
        password: this.state.password
      }
    }).then(res => {
      if(res.data.message === 'Login was successful!'){
        axios.defaults.headers.common['Authorization'] = res.data.jwt;
        storeJwt(res.data.jwt);
        this.props.getUserData(false, true);
      }
    }).catch((e) => {
      this.setState({error: e.response ? e.response.data : e.message})
    }).finally(() => {this.setState({loading: false})})
  }

  get loginDisabled(){
    if(this.state.newUser){
      return ((this.state.password !== this.state.confirmPassword) || !this.state.name.trim())
    }
    return (!this.state.email.trim() || !this.state.password.trim())
  }

  render(){
    return (
      <div id='loginDiv'>
        <form onSubmit={e => {
          e.preventDefault();
          if(!this.state.newUser) this.login();
          else this.register();
        }}>
          {this.state.newUser ? <div>{this.props.updating ? 'Update User:' : 'Creating new account!'}</div> : null}
          <div>
            {this.props.myRole === 'admin' ?
              this.props.displayed ? <div>{'Meals data is already loaded.'}</div> :
                <input className={'unselectedUserButton'} type='button' value={
                  `Edit${this.props.me ? ' Your' : ''} Meals Data`
                } onClick={
                  () => {
                    this.props.getDifferentUserData();
                    this.props.closeModal();
                  }}></input> : null}
          </div>
          {this.state.newUser ?
            <input placeholder={this.adminManagerEntry ? 'User\'s Name' : 'Your Name'}
              id='userName' type='text' onChange={e => {this.setState({name: e.target.value})}}
              value={this.state.name}></input> : null}
          <input  type='email' id='email' placeholder='email' value={this.state.email} onChange={
            e => this.setState({email: e.target.value})
          }></input>
          {this.adminManagerEntry ?
            <select id={'newUserRole'}
              onChange={e => {this.setState({role: e.target.value})}}
              value={this.state.role}>
                <option disabled={true} value={''}>{'Select Role'}</option>
                {this.props.roleOptions}
            </select> : null}
          {!this.props.updating ? <input type='password' id='password' placeholder={'password'} value={this.state.password} onChange={
            e => this.setState({password: e.target.value})
          }></input> : null}
          {this.state.newUser && !this.props.updating ?
            <input type='password' id='confirmPassword' placeholder={'confirm password'} value={this.state.confirmassword} onChange={
            e => this.setState({confirmPassword: e.target.value})
          }></input> : null}
          {this.state.newUser && !this.props.updating && this.state.confirmPassword && this.state.confirmPassword !== this.state.password ?
            <div className={'errorMessage'}>{'Passwords do not match!'}</div>: null}
          <div>
            <input type='submit' id='login' value={this.state.newUser ? this.props.updating ? 'Update Account' : 'Create Account' : 'Login'}
              disabled={this.loginDisabled}></input>
              {this.props.loading || this.state.loading ? <Loader /> : null}
          </div>
          <div>
            {this.state.deleting ?
              <React.Fragment>
                <div>{'Please confirm'}</div>
                <input type='button' value={'Cancel'} onClick={() => this.setState({deleting: false})}></input>
              </React.Fragment> : null}
              {this.props.updating ? <input className={'deleteUser'} value={`${this.state.deleting ? 'Yes, ' : ''}Delete`} type={'button'} onClick={() => {
                if(this.state.deleting) {
                  this.props.deleteUser(this.props.closeModal);
                }
                else this.setState({deleting: true})
              }}></input> : null }
              <input type='button'
                id={'loginToggle'}
                value={this.state.newUser ?
                  this.adminManagerEntry ? 'Cancel' : 'Back to login' :
                  'Create New User'}
                onClick={
                  () => {
                    if(this.adminManagerEntry) this.props.closeModal();
                    else this.setState({newUser: !this.state.newUser})
                  }
                }>
              </input>
            </div>
          <div className={'errorMessage'}>{this.state.error}</div>
        </form>
      </div>
    )
  }
}
