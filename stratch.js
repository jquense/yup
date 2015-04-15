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
      .when('rBType', { is: 0, then:  })
      .when('subRBTypeID', val => val === 1 ? this.required() : this
      })
  })
  .text('date range', 'Date must be between ${start} and ${end}', function(){

  })
  .text({ message: 'date', params: { start, end }}, function(){

  })
  .when('subRBTypeID')
    .is(0).then('noteDate')
    .is( v => v >= 0 ).then('noteDate')
