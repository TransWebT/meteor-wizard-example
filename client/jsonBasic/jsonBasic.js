

function hereDoc(f) {
    return f.toString().
    replace(/^[^\/]+\/\*!?/, '').
    replace(/\*\/[^\/]+$/, '');
}

var defaultModelStr = hereDoc(function() {/*!
Model=
{
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
}
 */});

var destroyForm = new ReactiveVar(false);
var reactiveModelStr = new ReactiveVar(defaultModelStr);
eval(reactiveModelStr.get());
var reactiveModel = new ReactiveVar(Model);
setupWizard(reactiveModel);

// Todo: fix the method below
function setupWizard (reactiveModel) {
    // reactiveModelToDisplay = new ReactiveVar(Model);

    WizardCollections = new Meteor.Collection(reactiveModel.get().collectionName, {connection: null});
    WizardSchemas = {};
    var schemaKeys = Object.keys(reactiveModel.get().schemas);
    for (var i = 0; i < schemaKeys.length; i++) {
        var schemaKey = schemaKeys[i];
        WizardSchemas[schemaKey] = new SimpleSchema(reactiveModel.get().schemas[schemaKey]);
    }

    for (var i = 0; i < reactiveModel.get().steps.length; i++) {
        // JSON spec for steps modified to use "schemaId" instead of "id" so that JSON.stringify() doesn't have issues with circular refs
        if (typeof reactiveModel.get().steps[i].schemaId !== 'undefined' && reactiveModel.get().steps[i].schemaId !== null) {
            reactiveModel.get().steps[i].id = reactiveModel.get().steps[i].schemaId;
        }

        if (typeof reactiveModel.get().steps[i].schemaKey !== 'undefined' && reactiveModel.get().steps[i].schemaKey !== null) {
            reactiveModel.get().steps[i].schema = WizardSchemas[reactiveModel.get().steps[i].schemaKey];
        }

        if (reactiveModel.get().steps[i].addSubmitAction === true) {
            reactiveModel.get().steps[i].onSubmit = function (data, wizard) {
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
}

Template.jsonBasic.rendered = function () {
    var template = this;

    // this is a wonky workaround for the fact that autoform doesn't handle reactively
    // changing schema attribute, which should be fixed eventually
    template.autorun(function () {
        if (destroyForm.get()) {
            destroyForm.set(false);
        }
    });
};

Template.jsonBasic.helpers({
    destroyForm: function () {
        return destroyForm.get();
    },
    steps: function () {
        var wizardSteps = reactiveModel.get().steps;
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
        editor = AceEditor.instance("archy", {theme: "dawn", mode: "javascript"});
        if(editor.loaded===true){
            e.stop();
            editor.insert(reactiveModelStr.get());
        }
    });
};

Template.jsonEditor.events({
    'click #read': function(e, tmopl) {
        var editor = AceEditor.instance("archy");
        if(editor.loaded===true){
            var editorContent = editor.getValue();
            reactiveModelStr.set(editorContent);
            eval(reactiveModelStr.get());
            reactiveModel.set(Model);
            destroyForm.set(true);
            setupWizard(reactiveModel);
            console.log("content: " + editorContent);
        }
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

