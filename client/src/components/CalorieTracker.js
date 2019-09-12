import React, { Component } from 'react';
import {ParChanger} from './ParChanger.js'
import {MealsList} from './MealsList.js'
import {MealsEntry} from './MealsEntry.js'

//This is a hub for all regular user functionality.
export class CalorieTracker extends Component {
  constructor(props){
    super(props);
    this.state = {
      updateMealsList: false //This let mealsEntry trip a refresh in MealsList.
    }
  }

  render(){
    return (
      <React.Fragment>
        <h1 className='header'>{`${this.props.name}'s Calorie Tracker`}</h1>
        <input type={'button'} id={'logout'} value={'Logout'} onClick={this.props.logout}></input>
        <div className={'sidebar'}>
          <ParChanger
            selectedId={this.props.selectedId}
            parCalories={this.props.parCalories} setPar={this.props.setPar}/>
          <MealsEntry selectedId={this.props.selectedId} updateMealsList={() => {
            this.setState({updateMealsList: !this.state.updateMealsList})
          }} />
        </div>
        <MealsList
          setModalContents={this.props.setModalContents}
          selectedId={this.props.selectedId} update={this.state.updateMealsList}
          parCalories={this.props.parCalories} />
      </React.Fragment>
    )
  }
}
