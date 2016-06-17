
Model = {
    collectionName: "orders",
    schemas: {
        contactInformation: {
            name: {
                type: String,
                label: 'Name'
            },
            address: {
                type: String,
                label: 'Address'
            },
            zipcode: {
                type: String,
                label: 'Zipcode'
            },
            city: {
                type: String,
                label: 'City'
            }
        },
        paymentInformation: {
            paymentMethod: {
                type: String,
                label: 'Payment method',
                allowedValues: ['credit-card', 'bank-transfer'],
                autoform: {
                    options: [{
                        label: 'Credit card',
                        value: 'credit-card'
                    }, {
                        label: 'Bank transfer',
                        value: 'bank-transfer'
                    }]
                }
            },
            acceptTerms: {
                type: Boolean,
                label: 'I accept the terms and conditions.',
                autoform: {
                    label: false
                },
                autoValue: function () {
                    if (this.isSet && this.value !== true) {
                        this.unset();
                    }
                }
            }
        }
    },
    steps: [
        {
            id: 'contact-information',
            title: 'Contact information',
            schemaKey: 'contactInformation'
        },
        {
            id: 'payment-information',
            title: 'Payment & confirm',
            schemaKey: 'paymentInformation',
            addSubmitAction: true
        }
    ]
};

WizardCollections = new Meteor.Collection(Model.collectionName, {connection: null});
WizardSchemas = {};
var schemaKeys = Object.keys(Model.schemas);
for (var i=0; i<schemaKeys.length; i++) {
    var schemaKey = schemaKeys[i];
    WizardSchemas[schemaKey] = new SimpleSchema(Model.schemas[schemaKey]);
}

for (var i=0; i<Model.steps.length; i++) {
    if (typeof Model.steps[i].schemaKey !== 'undefined' && Model.steps[i].schemaKey !== null) {
        Model.steps[i].schema = WizardSchemas[Model.steps[i].schemaKey];
    }

    if (Model.steps[i].addSubmitAction === true) {
        Model.steps[i].onSubmit = function (data, wizard) {
            var self = this;
            WizardCollections.insert(_.extend(wizard.mergedData(), data), function (err, id) {
                if (err) {
                    self.done();
                } else {
                    Router.go('viewOrderJsonBasic', {
                        _id: id
                    });
                }
            });
        }
    }
}


Template.jsonBasic.helpers({
    steps: function () {
        var wizardSteps = Model.steps;
        for (var i=0; i<wizardSteps.length; i++) {
            if (wizardSteps[i].addSubmitAction === true) {
                wizardSteps[i].onSubmit = function (data, wizard) {
                    var self = this;
                    WizardCollections.insert(_.extend(wizard.mergedData(), data), function (err, id) {
                        if (err) {
                            self.done();
                        } else {
                            Router.go('viewOrderJsonBasic', {
                                _id: id
                            });
                        }
                    });
                }
            }
        }
        return wizardSteps;
    }
});

Wizard.useRouter('iron:router');

Router.route('/jsonBasic/:step?', {
  name: 'jsonBasic',
  onBeforeAction: function() {
    if (!this.params.step) {
      this.redirect('jsonBasic', {
        step: 'contact-information'
      });
    } else {
      this.next();
    }
  }
});


// Todo: collection name below is hard-coded and should be reflect a generic name
Router.route('/jsonBasic/orders/:_id', {
  name: 'viewOrderJsonBasic',
  template: 'viewOrderJsonBasic',
  data: function() {
    return Orders.findOne(this.params._id);
  }
});


