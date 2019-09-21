import React, { Component } from 'react';
import './App.css';
import {storeJwt, getJwt} from './storage.js';
import {UserList} from './components/UserList.js';
import {Modal} from './components/Modal.js'
import {CalorieTracker} from './components/CalorieTracker.js'
import {Login} from './components/Login.js'
import axios from 'axios';

/*Make the api url correct no matter where this ends up.*/
axios.defaults.baseURL = function(){
  let s = window.location.href[4] === 's' ? 's' : ''
  let host = window.location.host
  let apiPath = `http${s}://${window.location.host}`
  if(host.slice(host.length - 5) === ':3000'){
    apiPath = apiPath.slice(0, apiPath.length - 1) + '1'
  }
  return apiPath + '/api/';
}()

//Set up api calls. auth header will be set in "getUserData" below if none is stored.
axios.defaults.headers.common['Authorization'] = getJwt()
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.interceptors.response.use(undefined, e => { //Let the user know if the jwt is rejected and take them to the login screen.
  if(e.response.data === 'Login Required'){
    setTimeout(() => {
      let logout = document.getElementById('logout')
      if(logout){
        logout.click()
      } else { //interface is already set to go.
        storeJwt(''); //clear out local storage
        axios.defaults.headers.common['Authorization'] = '';
      }
    }, 3000); //3s to be polite. Wrapped in the if just in case they already clicked it.
    e.response.data = 'Login Required'
  }
  return Promise.reject(e);
});

axios.interceptors.response.use((data) => {
  let token = data.headers.authorization //Update the jwt anytime the server sends one.
  if(token){
    axios.defaults.headers.common['Authorization'] = token;
    storeJwt(token);
  }
  return Promise.resolve(data)
})

class App extends Component {
  constructor(props){
    super(props);
    this.state = this.defaultState;
    this.getUserData = this.getUserData.bind(this);
    this.logout = this.logout.bind(this);
    this.state = {
      name: '',
      parCalories: 0,
      modalContents: null,
      loading: false
    }
    this.alreadyAttempted = 0 //In case the server does not respond, we can try a few more times.
  }

  get defaultState(){
    return {
      name: '',
      parCalories: 2000,
      role: 'regular',
      error: '',
      selectedId: '',
      myId: ''
    }
  }

  componentDidMount(){
    this.getUserData(); //init interface from database if a jwt is there.
  }

  //Sets complete user data (calories and name) at the app level when an admin clicks a "Edit Meals Data" button in the user edit modal.
  //MealsList refreshes if the selectedId changes, so that will be all set too.
  getUserData(_id, jwtNew){
    this.setState({loading: true})
    if(this.alreadyAttempted >= 5) return this.setState({error: 'We are experiencing technical difficulties. Please try again later.'})
    axios({
      url:`users`,
      method: 'GET',
      params: {_id: _id || undefined}
    }).then(async res => {
      var data = res.data;
      var myId = this.state.myId || data._id
      this.setState({selectedId: data._id,
        myId: myId, //Will set to active user on init.
        error: '',
        //If a user demotes themselves, their display will update accordingly.
        myRole: data._id === myId ? data.role : this.state.myRole,
        ...data
      });
    }).catch(e => {
      if(!e.response){ //No response means the server is down. Try request again.
        this.setState({error: 'Loading...'})
        this.alreadyAttempted += 1;
        setTimeout(() => {this.getUserData(_id)}, 1000)  //Try again in case the server was just having a moment (mostly for the developer environment).
      }
    }).finally(() => this.setState({loading: false}))
  }

  logout(){
    storeJwt(''); //clear out local storage
    axios.defaults.headers.common['Authorization'] = '';
    this.setState(this.defaultState)
  }

  render(){
    var contents
    if(Boolean(!this.state.name)){ //No name means they're not logged it since getUserData is called in componentDidMount if there's a jwt.
      contents = (
        <React.Fragment>
          <h1 className='header'>{'Welcome to Calorie Tracker!'}</h1>
          <Login getUserData={this.getUserData} loading={this.state.loading}/>
        </React.Fragment>
      )
    } else {
      contents = (//Modal is a the top layer so that is displays properly on mobile.
        <React.Fragment>
          {this.state.modalContents ? <Modal children={this.state.modalContents}/> : null}
          {/^admin|manager$/.test(this.state.myRole) ? <UserList
            setModalContents={contents => this.setState({modalContents: contents})}
            myRole={this.state.myRole}
            myId={this.state.myId}
            selectedId={this.state.selectedId}
            getUserData={_id => this.getUserData(_id)}/> : null}
          <CalorieTracker
            setModalContents={contents => this.setState({modalContents: contents})}
            role={this.state.role}
            name={this.state.name}
            logout={this.logout}
            selectedId={this.state.selectedId}
            parCalories={this.state.parCalories}
            loading={this.state.loading}
            setPar={newParCalories => this.setState({parCalories: newParCalories})} />
        </React.Fragment>)
    }
    return (
      <React.Fragment>
        {this.state.error ? this.state.error : contents}
      </React.Fragment>
    );
  }
}

export default App;
