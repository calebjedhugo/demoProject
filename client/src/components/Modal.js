import React, { Component } from 'react';
import FadeIn from 'react-fade-in';

export class Modal extends Component {
  render(){
    return (<div className='modalbackground'>
      <div className='modalBody'>
        <FadeIn>{this.props.children}</FadeIn>
      </div>
    </div>)
  }
}
