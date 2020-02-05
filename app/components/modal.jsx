import React from 'react'

export class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { title: '', message: '' };
  }

  show(title, message, callback) {
    this.setState({ title, message });
    $('#modal').off('hidden.bs.modal');
    $('#modal').on('hidden.bs.modal', function(e) {
      if (callback) {
        callback();
      }
    });
    $('#modal').modal('show');
  }

  render() {
    return (
      <div className="modal" id="modal" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{this.state.title}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{this.state.message}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">OK</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
