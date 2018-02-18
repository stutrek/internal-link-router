# Internal Link Router

This is a React component that wraps your app and intercepts clicks on <a> elements. If there's an href attribute that starts with `/` it will cancel the click and dispatch a react routing event. If there's a hash it will smoothly scroll the specified element into view.

## Basic Usage

```javascript
function startApp (routes) {
    ReactDOM.render((
        <Provider store={store}>
            <InternalLinkRouter>
                <Route path='/login' component={LoginLayout} />
                { /* all your other routes */ }
            </InternalLinkRouter>
        </Provider>
    ), container);
}
```
