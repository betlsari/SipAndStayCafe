using AutoMapper;
using SipAndStayCafe.Application.DTOs.Table;
using SipAndStayCafe.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SipAndStayCafe.Application.Mappings
{
    public sealed class TableMappingProfile : Profile
    {
        public TableMappingProfile()
        {
            CreateMap<Table, TableDto>();
            CreateMap<TableSession, TableSessionDto>()
                .ForCtorParam("TableNumber", opt => opt.MapFrom(src => src.Table.TableNumber))
                .ForCtorParam("PaymentMethod", opt => opt.MapFrom(src => src.PaymentMethod.ToString()))
                .ForCtorParam("PaymentStatus", opt => opt.MapFrom(src => src.PaymentStatus.ToString()));
        }
    }
}
