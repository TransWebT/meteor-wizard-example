
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
    }

    ,
    steps: [
        {
            schemaId: 'contact-information',
            title: 'Contact information',
            schemaKey: 'contactInformation'
        },

        {
            schemaId: 'payment-information',
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
    // JSON spec for steps modified to use "schemaId" instead of "id" so that JSON.stringify() doesn't have issues with circular refs
    if (typeof Model.steps[i].schemaId !== 'undefined' && Model.steps[i].schemaId !== null) {
        Model.steps[i].id = Model.steps[i].schemaId;
    }

    if (typeof Model.steps[i].schemaKey !== 'undefined' && Model.steps[i].schemaKey !== null) {
        Model.steps[i].schema = WizardSchemas[Model.steps[i].schemaKey];
    }

    if (Model.steps[i].addSubmitAction === true) {
        Model.steps[i].onSubmit = function (data, wizard) {
            var self = this;
            WizardCollections.insert(_.extend(wizard.mergedData(), data), function (err, docId) {
                if (err) {
                    self.done();
                } else {
                    Router.go('viewOrderJsonBasic', {
                        _id: docId
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
                    WizardCollections.insert(_.extend(wizard.mergedData(), data), function (err, docId) {
                        if (err) {
                            self.done();
                        } else {
                            Router.go('viewOrderJsonBasic', {
                                _id: docId
                            });
                        }
                    });
                }
            }
        }
        return wizardSteps;
    }
});


Template.jsonEditor.rendered = function(){
    var editor;
    Tracker.autorun(function (e) {
        editor = AceEditor.instance("archy", {theme: "dawn", mode: "json"});
        if(editor.loaded===true){
            e.stop();
            // editor.insert(JSON.stringify(Model));
        }
    });
}


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

/*
processedJSON =
{
    "collectionName"
:
    "orders", "schemas"
:
    {
        "contactInformation"
    :
        {
            "name"
        :
            {
                "label"
            :
                "Name"
            }
        ,
            "address"
        :
            {
                "label"
            :
                "Address"
            }
        ,
            "zipcode"
        :
            {
                "label"
            :
                "Zipcode"
            }
        ,
            "city"
        :
            {
                "label"
            :
                "City"
            }
        }
    ,
        "paymentInformation"
    :
        {
            "paymentMethod"
        :
            {
                "label"
            :
                "Payment method", "allowedValues"
            :
                ["credit-card", "bank-transfer"], "autoform"
            :
                {
                    "options"
                :
                    [{"label": "Credit card", "value": "credit-card"}, {
                        "label": "Bank transfer",
                        "value": "bank-transfer"
                    }]
                }
            }
        ,
            "acceptTerms"
        :
            {
                "label"
            :
                "I accept the terms and conditions.", "autoform"
            :
                {
                    "label"
                :
                    false
                }
            }
        }
    }
,
    "steps"
:
    [{
        "gid": "contact-information",
        "title": "Contact information",
        "schemaKey": "contactInformation",
        "schema": {
            "_schema": {
                "name": {"label": "Name"},
                "address": {"label": "Address"},
                "zipcode": {"label": "Zipcode"},
                "city": {"label": "City"}
            },
            "_schemaKeys": ["name", "address", "zipcode", "city"],
            "_autoValues": {},
            "_blackboxKeys": [],
            "_validators": [],
            "_messages": {},
            "_depsMessages": {"_dependentsById": {}},
            "_depsLabels": {
                "name": {"_dependentsById": {}},
                "address": {"_dependentsById": {}},
                "zipcode": {"_dependentsById": {}},
                "city": {"_dependentsById": {}}
            },
            "_firstLevelSchemaKeys": ["name", "address", "zipcode", "city"],
            "_objectKeys": {},
            "_validationContexts": {}
        }
    }, {
        "gid": "payment-information",
        "title": "Payment & confirm",
        "schemaKey": "paymentInformation",
        "addSubmitAction": true,
        "schema": {
            "_schema": {
                "paymentMethod": {
                    "label": "Payment method",
                    "allowedValues": ["credit-card", "bank-transfer"],
                    "autoform": {
                        "options": [{
                            "label": "Credit card",
                            "value": "credit-card"
                        }, {"label": "Bank transfer", "value": "bank-transfer"}]
                    }
                }, "acceptTerms": {"label": "I accept the terms and conditions.", "autoform": {"label": false}}
            },
            "_schemaKeys": ["paymentMethod", "acceptTerms"],
            "_autoValues": {},
            "_blackboxKeys": [],
            "_validators": [],
            "_messages": {},
            "_depsMessages": {"_dependentsById": {}},
            "_depsLabels": {"paymentMethod": {"_dependentsById": {}}, "acceptTerms": {"_dependentsById": {}}},
            "_firstLevelSchemaKeys": ["paymentMethod", "acceptTerms"],
            "_objectKeys": {},
            "_validationContexts": {}
        }
    }]
};
*/

