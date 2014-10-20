var yup = require('yup')

var NoteSchema = yup.object()
  .camelCase()
  .shape({
    noteID:      yup.number().min(1).default(0),
    notes:       yup.string().required(),
    subRBType:   yup.string(),
    rBType:      yup.string(),
    subRBTypeID: yup.number(),
    rBTypeID:    yup.number(),

    noteDate:    yup.date()
      .when('rBType', { is: then:  })
      .when('subRBTypeID', function(subRBTypeID){
        if(subRBTypeID == 1) return this.required()
        return this
      })
  })
  
  .when('subRBTypeID')
    .is('gte').to(0).then('noteDate')