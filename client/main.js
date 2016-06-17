Router.configure({
  layoutTemplate: 'layout'
});

Router.route('/', function() {
  this.redirect('jsonBasic');
});

Meteor.startup(function() {
  AutoForm.setDefaultTemplate("semanticUI");
});
