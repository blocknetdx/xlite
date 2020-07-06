import { connect } from 'react-redux';
import Login from './login';
import { setActiveView } from '../../actions/app-actions';

export default connect(
  null,
  dispatch => ({
    setActiveView: activeView => dispatch(setActiveView(activeView))
  })
)(Login);
