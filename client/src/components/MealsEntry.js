import React, { Component } from 'react';
import {Loader} from './Loader.js'
import axios from 'axios';

export class MealsEntry extends Component {
  constructor(props){
    super(props);
    this.state = this.defaultState
    this.saveMeal = this.saveMeal.bind(this);
  }

  //Date and time need to be seperate since we need to filter by time of day, not just a simple date range.
  //So the time is stored as a single number (minutes) and the date is stored without the time of day.
  get defaultState(){
    var theDate = new Date()
    return {
      description: this.props.description || '',
      calories: this.props.calories || '',
      month: this.props.month || theDate.getMonth() + 1,
      date: this.props.date || theDate.getDate(),
      year: this.props.year || theDate.getFullYear(),
      hours: this.props.hours || theDate.getHours(),
      minutes: this.props.minutes || theDate.getMinutes(),
      error: '',
      success: '',
      dateRangeWarning: false, //It's polite to warn the user if the edit will put the entry out of view.
      dateRangeWarningNoted: false,
      loading: false
    }
  }

  componentDidUpdate(){
    let outOfRange = (this.enteredDate < new Date(this.props.fromDate) || this.enteredDate > new Date(this.props.toDate))
    if(!this.state.dateRangeWarning && outOfRange){
      this.setState({dateRangeWarning: true})
    } else if(this.state.dateRangeWarning && !outOfRange){
      this.setState({dateRangeWarning: false})
    }
  }

  get enteredDate(){
    return new Date(`${this.state.month}/${this.state.date}/${this.state.year}`)
  }

  saveMeal(){
    if(this.state.dateRangeWarning && !this.state.dateRangeWarningNoted){
      return this.setState({dateRangeWarningNoted: true, error: 'You are setting your meal outside the visible date range. Submit again to confirm.'})
    }
    this.setState({loading: true})
    axios({
      url: `meals`,
      method: this.props.editing ? 'PATCH' : 'POST',
      data: {
        description: this.state.description,
        calories: this.state.calories,
        date: this.enteredDate,
        time: (Number(this.state.hours) * 60) + Number(this.state.minutes),
        userId: this.props.selectedId,
        _id: this.props._id
      }
    }).then(res => {
      var data = res.data;
      var newState = this.defaultState;
      newState.success = `Added "${data.description}" to your meals!`;
      this.setState(newState);
      if(this.props.editing) this.props.closeModal();
      else this.setState({loading: false}) //This is the non modal one.
      this.props.updateMealsList();
    }).catch(e => {
      this.setState({error: e.response ? e.response.data : e.message, loading: false})
    })
  }

  render(){
    var editing = this.props.editing
    var inputProps = {
      onFocus: e => e.target.select(), //Seems like a bug in react makes this not work for iPhones?
      type: 'number'
    }
    return (
      <div className={'mealsEntry'}>
        <h2>{`${this.props.editing ? 'Change This' : 'Add a'} Meal`}</h2>
        <form onSubmit={e => {
          e.preventDefault();
          this.saveMeal();
        }}>
          <input placeholder={'Description'} type='text' id={`enterDescription${editing ? 'Edit' : ''}`} value={this.state.description} onChange={e => this.setState({description: e.target.value})}></input>
          <input placeholder={'Number of Calories'} type='number' id={`enterCalories${editing ? 'Edit' : ''}`} value={this.state.calories} onChange={e => this.setState({calories: e.target.value})}></input>

          <div>
            <label htmlFor='enterMonth'>{'Date'}</label>
            <input {...inputProps} min='1' max='12' id={`enterMonth${editing ? 'Edit' : ''}`} value={this.state.month} onChange={e => this.setState({month: e.target.value})}></input>
            <input {...inputProps} min='1' max='31' id={`enterDate${editing ? 'Edit' : ''}`} value={this.state.date} onChange={e => this.setState({date: e.target.value})}></input>
            <input {...inputProps} min='1900' max='9999' id={`enterYear${editing ? 'Edit' : ''}`} value={this.state.year} onChange={e => this.setState({year: e.target.value})}></input>
          </div>
          <div>
            <label htmlFor='enterTime'>{'Time'}</label>
            <input {...inputProps} min='0' max='23' id={`enterTime${editing ? 'Edit' : ''}`} value={this.state.hours} onChange={e => this.setState({hours: e.target.value})}></input>
            <input {...inputProps} min='1' max='60' id={`enterMinutes${editing ? 'Edit' : ''}`} value={this.state.minutes} onChange={e => this.setState({minutes: e.target.value})}></input>
          </div>
          {this.state.error ? <div className={'errorMessage'}>{this.state.error}</div> : null}
          {this.state.success ? <div className={'successMessage'}>{this.state.success}</div> : null}
          <input id={`confirmConsumption${editing ? 'Edit' : ''}`} type='submit' value={'Confirm Consumption'}></input>{this.state.loading || this.props.loading ? <Loader /> : null}
        </form>
        {this.props.editing ?
          <React.Fragment>
            <input type={'button'} value='Cancel' onClick={() => this.props.closeModal()}></input>
            {this.state.deleting ?
              <React.Fragment>
                <div>{'Please confirm'}</div>
                <input type='button' value={'Cancel'} onClick={() => this.setState({deleting: false})}></input>
              </React.Fragment> : null}
            <input className={'deleteMealButton'} value={`${this.state.deleting ? 'Yes, ' : ''}Delete`} type={'button'} onClick={() => {
              if(this.state.deleting){
                this.props.deleteEntry();
                this.props.closeModal(); //Deleting should only be possible when editing.
              }
              else this.setState({deleting: true})
            }}></input>
          </React.Fragment> : null}
      </div>
    )
  }
}
