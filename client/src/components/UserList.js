import React, { Component } from 'react';
import {Login} from './Login.js';
import {Search} from './Search.js';
import axios from 'axios';

export class UserList extends Component {
  constructor(props){
    super(props);
    this.getUserList = this.getUserList.bind(this);
    this.state = {
      error: '',
      data: [],
      count: 0,
      skip: 0,
      search: '',
      max: 10,
      success: '',
      loading: false
    }
  }

  get roleOptions(){ //Changes base on user's role. Managers can't edit admins or make someone an admin.
    var optionsArray = [<option key={'regular'} id={'newRegularSelect'} value={'regular'}>{'regular'}</option>];

    if(/^manager|admin$/.test(this.props.myRole)){
      optionsArray.push(<option key={'manager'} id={'newManagerSelect'} value={'manager'}>{'manager'}</option>);
    }

    if(this.props.myRole === 'admin'){
      optionsArray.push(<option key={'admin'} id={'newAdminSelect'} value={'admin'}>{'admin'}</option>);
    }

    return optionsArray;
  }

  componentDidMount(){
    this.getUserList(); //init list.
  }

  componentDidUpdate(prevProps, prevState){
    if(prevState.skip !== this.state.skip ||
      prevState.max !== this.state.max ||
      prevState.search !== this.state.search){
        this.getUserList()
    }
  }

  getUserList(){
    this.setState({loading: true})
    axios({
      url: `users/getUserList`,
      method: 'GET',
      params: {
        search: this.state.search,
        skip: this.state.skip,
        max: this.state.max
      }
    }).then(res => {
      var data = res.data;
      this.setState({error: '', success: '', data: data.users, count: data.count});
    }).catch(e => {
      this.setState({error: e.response ? e.response.data : e.message})
    }).finally(() => this.setState({loading: false}))
  }

  deleteUser(_id, callback){
    this.setState({loading: true})
    axios({url: `users`,
      method: 'DELETE',
      data: {_id: _id}
    }).then(res => {
      this.setState({error: '', success: `Deleted ${res.data.name}, ${res.data.email}.`});
      this.getUserList()
    }).catch(e => {
      this.setState({error: e.response ? e.response.data : e.message})
    }).finally(() => {
      this.setState({loading: false})
      if(callback) callback();
    })
  }

  get users(){ //converts the data to jsx objects.
    var list = [];
    this.state.data.forEach((elem, i) => {
      var isThisMe = elem._id === this.props.myId
      list.push(<UserEntry
        deleteUser={callback => this.deleteUser(elem._id, callback)}
        setModalContents={this.props.setModalContents}
        roleOptions={this.roleOptions}
        getUserData={() => {
          this.props.getUserData(elem._id)
        }}
        getUserList={this.getUserList}
        key={elem._id}
        thisIsMe={isThisMe}
        displayed={elem._id === this.props.selectedId}
        myRole={this.props.myRole}
        updateData={newData => {
          var allData = this.state.data;
          allData[i] = newData;
          this.setState({data: allData});
          //And refresh the displayed data if the user is selected.
          if(elem._id === this.props.selectedId) this.props.getUserData(this.props.selectedId);
        }}
        {...elem} />)
    })

    return (
      <React.Fragment>
        <div className={'userListHeader'}>
          <NewUser
            loading={this.state.loading}
            setModalContents={this.props.setModalContents}
            getUserList={this.getUserList}
            myId={this.props.myId}
            roleOptions={this.roleOptions} />
          <Search
            loading={this.state.loading}
            skip={this.state.skip}
            count={this.state.count}
            max={this.state.max}
            setSkip={newSkip => {this.setState({skip: newSkip || 0})}}
            setMax={newMax => {
              newMax = Number(newMax);
              this.setState({
                skip: Math.floor(Number(this.state.skip) / newMax) * newMax,
                max: Number(newMax)})
              }
            }
            setSearch={newSearch => this.setState({search: newSearch})}/>
        </div>
        <div className={'userListTable'}>
          <table>
              <tbody>
                {this.state.success ? <tr><td colSpan='3'><div className={'successMessage'}>{this.state.success}</div></td></tr> : null}
                {list}
              </tbody>
            </table>
        </div>
      </React.Fragment>)
  }

  render(){
    if(this.props.myRole === 'regular') return null;
    return (<div className={'userList'}>
      <h2>{'Calorie Tracker Users'}</h2>
      {this.users}
      {this.state.error ? <div className='errorMessage'>{this.state.error}</div> : null}
    </div>)
  }
}

class NewUser extends Component{
  constructor(props){
    super(props);
    this.state = {active: false}
  }

  render(){
    return (
      <React.Fragment>
      <input type={'button'}
        id={'createNewUser'}
        value={'Create New User'}
        onClick={() => {this.props.setModalContents(
          <Login
            loading={this.props.loading}
            getUserData={this.props.getUserList}
            roleOptions={this.props.roleOptions}
            closeModal={() => this.props.setModalContents(null)} />
        )}}></input>
      </React.Fragment>
    )
  }
}

class UserEntry extends Component{
  constructor(props){
    super(props);
    this.updateUser = this.updateUser.bind(this);
    this.state = {
      error: '',
      deleting: false,
      loading: false
    }
  }

  updateUser(changeQuery, callback){
    this.setState({loading: true})
    axios({
      url: `users`,
      method: 'PATCH',
      data: {_id: this.props._id, ...changeQuery}
    }).then(res => {
      this.props.updateData(res.data);
      this.setState({error: ''})
    }).catch(e => {
      this.setState({error: e.response ? e.response.data : e.message})
    }).finally(e => {
      if(callback) callback();
      this.setState({loading: false})
    })
  }

  render(){
    var me = this.props.thisIsMe
    return (<React.Fragment>
        <tr className={`${this.props.displayed ? 'currentUserEntry ' : ''}userEntry`}
          onClick={() => {
            if(this.props.myRole !== 'admin' && this.props.role === 'admin'){
              this.setState({error: 'You may not edit admins.'})
            } else {
            this.props.setModalContents(
              <Login
                me={me}
                myRole={this.props.myRole}
                updateUser={this.updateUser}
                updating={true}
                adminManagerEntry={true}
                deleteUser={this.props.deleteUser}
                roleOptions={this.props.roleOptions}
                getUserData={this.props.getUserData}
                displayed={this.props.displayed}
                closeModal={() => this.props.setModalContents(null)}
                name={this.props.name}
                email={this.props.email}
                role={this.props.role}
                loading={this.state.loading} />
            )}}}>
          <td className={'userName'}>{`${this.props.name}${me ? ' (You)' : ''}`}</td>
          <td id={this.props.email}>{this.props.email}</td>
          <td className={'newUserRole'}>{this.props.role}</td>
        </tr>
        {this.state.error ? <tr>
          <td colSpan='3'>{<div className='errorMessage'>{this.state.error}</div>}</td>
        </tr> : null}
      </React.Fragment>)
  }
}
