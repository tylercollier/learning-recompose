////////////////////////////////////////////////////////////////////////////////
// Exercise:
//
// Showing feedback in the UI is very important for user experience. However, this can lead to messy render functions.
// Let's utilize HoCs to better organization our code to handle these different states.
// Convert the class component into a stateless functional component by extracting the state, methods and lifecycle methods into Recompose HoCs.
// - Extract the conditional render logic, for loading, error and success into their own components.
// By using Recompose's branch HoC, https://github.com/acdlite/recompose/blob/master/docs/API.md#branch do the following
// - Show a loading spinner instead of the content. Once the content has finished loading, show that.
// - Show an error message when we get an error. Make sure to not show the content or the loading spinner if we get in this error state.
//
// Don't forget to refer to the recompose docs!
// https://github.com/acdlite/recompose/blob/master/docs/API.md
//
// Got extra time?
//
// - Once we successfully load the content, use the branch HoC on a component that conditionally renders the success message.
// (Hint: renderNothing might come in handy, https://github.com/acdlite/recompose/blob/master/docs/API.md#rendernothing)
// - Make the success message disappear after 1.5 seconds.
////////////////////////////////////////////////////////////////////////////////
import React from 'react'
import {
  compose,
  withState,
  withHandlers,
  lifecycle,
  branch,
  renderComponent,
  renderNothing,
} from 'recompose'
import { Alert, Button, Panel } from 'react-bootstrap'
import fetchContent from './fetchContent'
import isEmpty from 'lodash/isEmpty'
import LoadingSpinner from './LoadingSpinner'
import QuoteLeft from 'react-icons/lib/fa/quote-left'
import QuoteRight from 'react-icons/lib/fa/quote-right'
import './index.scss'

// Render an error message if our xhr request fails
const ErrorComponent = () => (
  <Alert bsStyle="danger">
    <strong>Error!</strong> We encountered an error while loading your content!
  </Alert>
)

const SuccessMessageComponent = () => (
  <Alert bsStyle="success">
    <strong>Success!</strong> We loaded your quote successfully
  </Alert>
)

const SuccessMessage = compose(
  withState('show', 'updateShow', ({ showMessage }) => showMessage),
  withHandlers({
    brieflyShow: ({ updateShow }) => () => {
      updateShow(true)
      return setTimeout(() => {
        updateShow(false)
      }, 1500)
    },
  }),
  lifecycle({
    componentWillReceiveProps({ showMessage: updatedShow }) {
      const { showMessage: prevShow } = this.props
      if (updatedShow !== prevShow && updatedShow) {
        this.props.brieflyShow()
      }
    },
  }),
  branch(({ show }) => !show, renderNothing),
)(SuccessMessageComponent)

// Render the quote if none of the other conditions are met
const QuoteComponent = ({ quote }) => (
  <Panel header={quote.title}>
    <QuoteLeft className="quote left" />
    {' '}
    {quote.content}
    {' '}
    <QuoteRight className="quote right" />
  </Panel>
)

// Conditionally render based on the state of the xhr
const Quote = compose(
  branch(({ loading }) => loading, renderComponent(LoadingSpinner)),
  branch(({ loadError }) => loadError, renderComponent(ErrorComponent)),
  branch(({ quote }) => isEmpty(quote), renderNothing),
)(QuoteComponent)

const enhance = compose(
  withState('loading', 'updateLoading', false),
  withState('loadError', 'updateLoadError', false),
  withState('loadSuccess', 'updateLoadSuccess', false),
  withState('quote', 'updateQuote', {}),
  withHandlers({
    fetchContent: ({
      updateLoading,
      updateQuote,
      updateLoadError,
      updateLoadSuccess,
    }) => async () => {
      try {
        updateLoading(true)
        updateLoadSuccess(false)
        const quote = await fetchContent()
        updateLoadSuccess(true)
        updateQuote(quote)
        updateLoadError(false)
      } catch (error) {
        updateLoadSuccess(false)
        updateLoadError(true)
      }
      updateLoading(false)
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchContent()
    },
  }),
)

const AppComponent = ({ fetchContent, ...props }) => (
  <div className="render-states owl">
    <SuccessMessage showMessage={props.loadSuccess} />
    <Quote {...props} />
    <Button onClick={fetchContent} disabled={props.loading}>New quote</Button>
  </div>
)

const App = enhance(AppComponent)

export { App as Solution }
